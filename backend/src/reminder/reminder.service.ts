import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Reminder } from './entities/reminder.entity';
import { Repository, DataSource, Brackets } from 'typeorm';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { CreateSelfReminderDto } from './dto/create-self-reminder.dto';
import { ReminderProcessStatus, ReminderStatus } from './enums/reminder.enum';
import { CreateReminderForUserDto } from './dto/create-reminder-for-user.dto';

@Injectable()
export class ReminderService {
  constructor(
    @InjectQueue('reminder')
    private readonly reminderQueue: Queue,
    private readonly dataSource: DataSource,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
  ) {}

  validateRemindAt(remindAt: Date) {
    if (remindAt.getTime() <= Date.now()) {
      throw new BadRequestException('Remind at must be in the future');
    }
  }

  async create(dto: CreateReminderForUserDto, creatorId: number) {
    this.validateRemindAt(dto.remindAt);

    const isAssigneeExist = await this.dataSource
      .createQueryBuilder(User, 'user')
      .where('user.id = :assigneeId', { assigneeId: dto.assigneeId })
      .getExists();

    if (!isAssigneeExist) throw new NotFoundException('Assignee not found');

    const reminder = this.reminderRepo.create({
      ...dto,
      creatorId,
      status: ReminderStatus.ACTIVE,
      processStatus: ReminderProcessStatus.PENDING,
    });

    await this.reminderRepo.save(reminder);

    return reminder;
  }

  async createSelf(dto: CreateSelfReminderDto, creatorId: number) {
    this.validateRemindAt(dto.remindAt);

    const reminder = this.reminderRepo.create({
      ...dto,
      creatorId,
      assigneeId: creatorId,
      status: ReminderStatus.ACTIVE,
      processStatus: ReminderProcessStatus.PENDING,
    });
    await this.reminderRepo.save(reminder);

    return reminder;
  }

  async findOneForWorker(reminderId: number) {
    return this.reminderRepo.findOne({
      where: {
        id: reminderId,
        status: ReminderStatus.ACTIVE,
      },
      relations: {
        assignee: true,
      },
    });
  }

  async assertReminderCreator(creatorId: number, reminderId: number) {
    const reminder = await this.reminderRepo.findOne({
      where: {
        id: reminderId,
      },
      select: ['id', 'creatorId', 'status', 'processStatus', 'jobId'],
    });

    if (!reminder) throw new NotFoundException('Reminder not found');

    if (reminder.creatorId !== creatorId) throw new ForbiddenException();

    return reminder;
  }

  async update(
    currentUserId: number,
    reminderId: number,
    dto: UpdateReminderDto,
  ) {
    const reminder = await this.assertReminderCreator(
      currentUserId,
      reminderId,
    );

    if (reminder.status !== ReminderStatus.ACTIVE)
      throw new BadRequestException(`Reminder is ${reminder.status}`);

    this.reminderRepo.merge(reminder, dto);

    await this.reminderRepo.save(reminder);

    if (dto.remindAt) {
      this.validateRemindAt(dto.remindAt);
      reminder.jobId = null;
      reminder.processStatus = ReminderProcessStatus.PENDING;

      if (reminder.jobId) await this.reminderQueue.remove(reminder.jobId);
    }

    return reminder;
  }

  async addJob(reminderId: number, remindAt: Date) {
    const delay = remindAt.getTime() - Date.now();

    if (delay <= 0) {
      throw new BadRequestException('remindAt must be in the future');
    }

    const jobId = `reminder-${reminderId}`;

    const job = await this.reminderQueue.add(
      'send-reminder',
      { reminderId },
      {
        jobId,
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return job;
  }

  async cancel(currentUserId: number, reminderId: number) {
    const reminder = await this.assertReminderCreator(
      currentUserId,
      reminderId,
    );

    if (reminder.status === ReminderStatus.CANCELLED)
      throw new BadRequestException('Reminder already CANCELLED');

    if (reminder.processStatus === ReminderProcessStatus.SUCCESS)
      throw new BadRequestException(
        'Reminder with status COMPLETED cannot not be cancel',
      );

    reminder.status = ReminderStatus.CANCELLED;
    await this.reminderRepo.save(reminder);

    if (reminder.jobId) {
      await this.reminderQueue.remove(reminder.jobId);
    }
  }

  async triggerSuccess(reminder: Reminder) {
    if (reminder.processStatus === ReminderProcessStatus.SUCCESS) {
      return;
    }

    if (reminder.status !== ReminderStatus.ACTIVE) {
      return;
    }

    reminder.processStatus = ReminderProcessStatus.SUCCESS;

    await this.reminderRepo.save(reminder);
  }

  async triggerFailed(reminder: Reminder) {
    if (reminder.processStatus === ReminderProcessStatus.FAILED) {
      return;
    }

    if (reminder.status !== ReminderStatus.ACTIVE) {
      return;
    }

    reminder.processStatus = ReminderProcessStatus.FAILED;
    await this.reminderRepo.save(reminder);
  }

  async findAll(userId: number, paginationDto?: PaginationDto) {
    const queryBuilder = this.reminderRepo
      .createQueryBuilder('reminder')
      .leftJoin('reminder.assignee', 'assignee')
      .leftJoin('reminder.creator', 'creator')
      .addSelect(['reminder.createdAt'])
      .orderBy('reminder.createdAt', 'DESC');

    queryBuilder.where(
      new Brackets((qb) => {
        qb.where('assignee.id = :userId').orWhere('creator.id = :userId');
      }),
      { userId },
    );

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.andWhere(
          'LOWER(reminder.title) LIKE :search OR LOWER(reminder.message) LIKE :search',
          {
            search: `%${search.toLowerCase()}%`,
          },
        );
      }

      queryBuilder.skip(page * limit).take(limit);
    }

    const [reminders, total] = await queryBuilder.getManyAndCount();

    return { reminders, total };
  }

  async findOne(id: number) {
    const reminder = await this.reminderRepo.findOneBy({ id });

    if (!reminder) throw new NotFoundException('Reminder not found!');

    return reminder;
  }
}
