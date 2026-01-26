import {
  ReminderStatus,
  ReminderProcessStatus,
} from '../reminder/enums/reminder.enum';
import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ReminderService } from '../reminder/reminder.service';
import { Reminder } from '../reminder/entities/reminder.entity';

@Injectable()
export class ReminderCronService {
  private readonly QUEUE_WINDOW_MS =
    Number(process.env.QUEUE_WINDOW_MS) || 60 * 60 * 1000;

  constructor(
    private readonly dataSource: DataSource,
    private readonly reminderService: ReminderService,
    @InjectRepository(Reminder)
    private readonly reminderRepo: Repository<Reminder>,
  ) {}

  @Cron('*/1 * * * *')
  async handleReminderQueueing() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + this.QUEUE_WINDOW_MS);

    const reminders = await this.reminderRepo
      .createQueryBuilder('r')
      .select(['r.id'])
      .where('r.status = :status', { status: ReminderStatus.ACTIVE })
      .andWhere('r.processStatus = :processStatus', {
        processStatus: ReminderProcessStatus.PENDING,
      })
      .andWhere('r.remindAt BETWEEN :now AND :windowEnd', {
        now,
        windowEnd,
      })
      .orderBy('r.remindAt', 'ASC')
      .limit(100)
      .getMany();

    for (const reminder of reminders) {
      await this.queueReminderSafely(reminder.id);
    }
  }

  async queueReminderSafely(reminderId: number) {
    const claimResult = await this.dataSource
      .createQueryBuilder()
      .update(Reminder)
      .set({
        processStatus: ReminderProcessStatus.SCHEDULING,
      })
      .where(
        `
        id = :id
        AND status = :status
        AND processStatus = :processStatus
        AND jobId IS NULL
        `,
        {
          id: reminderId,
          status: ReminderStatus.ACTIVE,
          processStatus: ReminderProcessStatus.PENDING,
        },
      )
      .execute();

    if (claimResult.affected !== 1) return;

    try {
      // Add job to queue
      const reminder = await this.reminderService.findOne(reminderId);

      const job = await this.reminderService.addJob(
        reminder.id,
        reminder.remindAt,
      );

      await this.reminderRepo.update(reminder.id, {
        jobId: job.id,
        processStatus: ReminderProcessStatus.SCHEDULED,
      });
    } catch (error) {
      // Rollback so cron can retry later
      await this.reminderRepo.update(reminderId, {
        processStatus: ReminderProcessStatus.PENDING,
      });

      throw error;
    }
  }
}
