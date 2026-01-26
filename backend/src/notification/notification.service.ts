import {
  In,
  Not,
  IsNull,
  DataSource,
  Repository,
  EntityManager,
} from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { NotificationType } from './enums/notification.enums';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dtos/create-notification.dto';
import { CreateRawNotificationDto } from './dtos/create-raw-notification.dto';
import { NotificationReceiver } from './entities/notifications_receivers.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationReceiver)
    private notificationReceiverRepo: Repository<NotificationReceiver>,
    private dataSource: DataSource,
  ) {}

  async assertNotificationReceiverExist(
    notificationId: number,
    receiverId: number,
  ) {
    console.log(receiverId, notificationId);

    const exists = await this.notificationReceiverRepo.exists({
      where: {
        notificationId,
        receiverId,
        deletedAt: Not(IsNull()),
      },
    });

    if (!exists) throw new NotFoundException('Notification not found');
  }

  validateNotificationInput(
    dto: CreateNotificationDto | CreateRawNotificationDto,
  ) {
    switch (dto.type) {
      case NotificationType.SYSTEM:
        if (dto.objectType || dto.objectId) {
          throw new BadRequestException(
            '[NOTIFICATION][SYSTEM] must not have object or triggerAt',
          );
        }
        break;

      case NotificationType.REMINDER:
        if (!dto.objectType || !dto.objectId) {
          throw new BadRequestException(
            '[NOTIFICATION][REMINDER] must link to an object',
          );
        }
        break;

      case NotificationType.ACTIVITY:
      case NotificationType.ALERT:
        if (!dto.objectType || !dto.objectId) {
          throw new BadRequestException(
            `[NOTIFICATION][${dto.type}] must link to an object`,
          );
        }
        break;
      default:
        throw new BadRequestException('Invalid notification type');
    }
  }

  async notifyUsers(createNotificationDto: CreateNotificationDto) {
    await this.dataSource.transaction(async (manager) => {
      const { receiverIds, ...createRawNotificationDto } =
        createNotificationDto;

      const notification = await this.createRawNotification(
        manager,
        createRawNotificationDto,
      );

      await this.assignReceiversToNotification(
        manager,
        notification.id,
        receiverIds,
      );
    });
  }

  async createRawNotification(
    manager: EntityManager,
    dto: CreateRawNotificationDto,
  ) {
    this.validateNotificationInput(dto);

    const notification = manager.getRepository(Notification).create(dto);
    return await manager.save(notification);
  }

  async assignReceiversToNotification(
    manager: EntityManager,
    notificationId: number,
    receiverIds: number[],
  ) {
    const uniqueReceiverIds = [...new Set(receiverIds)];

    if (!uniqueReceiverIds.length) return;

    const count = await manager.countBy(User, {
      id: In(uniqueReceiverIds),
    });

    if (count !== uniqueReceiverIds.length) {
      throw new NotFoundException('Some receivers not found');
    }

    const rows = uniqueReceiverIds.map((userId) => ({
      notificationId,
      receiverId: userId,
      readAt: null,
    }));
    await manager.getRepository(NotificationReceiver).insert(rows);
  }

  async findAll(receiverId: number, paginationDto?: PaginationDto) {
    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .innerJoinAndSelect(
        'notification.notificationReceivers',
        'nr',
        'nr.receiverId = :receiverId',
        { receiverId },
      )
      .select([
        'notification.id',
        'notification.type',
        'notification.title',
        'notification.message',
        'notification.objectType',
        'notification.objectId',
        'notification.meta',
        'notification.createdAt',
        'nr.receiverId',
        'nr.readAt',
        'nr.deletedAt',
      ])
      .orderBy('notification.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        qb.andWhere(
          '(LOWER(notification.title) LIKE :search OR LOWER(notification.message) LIKE :search)',
          { search: `%${search.toLowerCase()}%` },
        );
      }

      qb.skip(page * limit).take(limit);
    }

    const [notifications, total] = await qb.getManyAndCount();
    return { notifications, total };
  }

  async findOne(id: number) {
    const notification = await this.notificationRepo.findOneBy({ id });
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async findOneWithReceiverId(notificationId: number, receiverId: number) {
    const notification = await this.dataSource
      .createQueryBuilder(Notification, 'notification')
      .innerJoin(
        'notification.notificationReceivers',
        'rf',
        'rf.receiverId = :receiverId AND rf.deletedAt IS NULL',
        { receiverId },
      )
      .where('notification.id = :id', { id: notificationId })
      .getOne();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(notificationId: number, currentUserId: number) {
    await this.assertNotificationReceiverExist(notificationId, currentUserId);

    await this.notificationReceiverRepo.update(
      {
        notificationId,
        receiverId: currentUserId,
        readAt: IsNull(),
      },
      {
        readAt: new Date(),
      },
    );
  }

  async markAllAsRead(currentUserId: number) {
    const result = await this.notificationReceiverRepo.update(
      {
        receiverId: currentUserId,
        readAt: IsNull(),
      },
      {
        readAt: new Date(),
      },
    );

    return result.affected ?? 0;
  }

  async markAsUnread(notificationId: number, currentUserId: number) {
    await this.assertNotificationReceiverExist(notificationId, currentUserId);

    await this.notificationReceiverRepo.update(
      {
        notificationId,
        receiverId: currentUserId,
        readAt: Not(IsNull()),
      },
      {
        readAt: null,
      },
    );
  }

  async remove(notificationId: number, receiverId: number) {
    const notificationReceiver = await this.notificationReceiverRepo.exists({
      where: {
        notificationId,
        receiverId,
        deletedAt: IsNull(),
      },
    });

    if (!notificationReceiver) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationReceiverRepo.update(
      { notificationId, receiverId, deletedAt: IsNull() },
      { deletedAt: new Date() },
    );
  }
}
