import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { Notification } from './entities/notification.entity';
import { NotificationController } from './notification.controller';
import { NotificationAccessService } from './notification-access.service';
import { AuthorizationModule } from '../authorization/authorization.module';
import { NotificationReceiver } from './entities/notifications_receivers.entity';
import { LeadNotificationListener } from './listeners/lead-notification.listener';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationReceiver]),
    AuthorizationModule,
    RefreshTokenModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationAccessService,
    LeadNotificationListener,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
