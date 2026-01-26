import {
  RemoveRolePayload,
  AssignRolePayload,
  AccountBannedPayload,
} from '../events/alert.payload';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlertEvents } from './../events/alert.events';
import { NotificationService } from '../notification.service';
import { alertBuilder } from '../builders/alert-notification.builder';

@Injectable()
export class AlertListerner {
  constructor(private notificationService: NotificationService) {}

  @OnEvent(AlertEvents.AUTHOR_ROLE_REMOVED)
  async handleUnassignRole(payload: RemoveRolePayload) {
    const dto = alertBuilder.AUTHOR_ROLE_REMOVED(payload);

    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(AlertEvents.AUTHOR_ROLE_ASSIGNED)
  async handleAssignRole(payload: AssignRolePayload) {
    const dto = alertBuilder.AUTHOR_ROLE_ASSIGNED(payload);

    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(AlertEvents.AUTHEN_ACCOUNT_BANNED)
  async handleAccountLocked(payload: AccountBannedPayload) {
    const dto = alertBuilder.AUTHEN_ACCOUNT_BANNED(payload);

    await this.notificationService.notifyUsers(dto);
  }
}
