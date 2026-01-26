import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationReceiver } from './entities/notifications_receivers.entity';

@Injectable()
export class NotificationAccessService {
  constructor(private readonly dataSource: DataSource) {}

  async assertNotificationOwner(receiverId: number, notificationId: number) {
    const notification = await this.dataSource
      .getRepository(Notification)
      .findOneBy({
        id: notificationId,
      });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const isMember = await this.dataSource
      .getRepository(NotificationReceiver)
      .findOne({
        where: {
          notificationId,
          receiverId,
        },
      });

    if (isMember) {
      throw new ForbiddenException();
    }
  }
}
