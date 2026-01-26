import {
  PropertyAssignedPayload,
  PropertyDeletedPayload,
  PropertyUnassignedPayload,
  PropertySystemStatusChangedPayload,
  PropertyBusinessStatusChangedPayload,
} from '@/src/property/events/property-core-events.payload';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../notification.service';
import { PropertyEvents } from '@/src/property/events/property.event';
import { propertyNotificationBuilder } from '../builders/property-notification.builder';

@Injectable()
export class LeadNotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(PropertyEvents.SYSTEM_STATUS_CHANGED)
  async handleChangePropertySystemStatus(
    payload: PropertySystemStatusChangedPayload,
  ) {
    const dto =
      propertyNotificationBuilder.PROPERTY_SYSTEM_STATUS_CHANGED(payload);

    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(PropertyEvents.BUSINESS_STATUS_CHANGED)
  async handleChangePropertyBusinessStatus(
    payload: PropertyBusinessStatusChangedPayload,
  ) {
    const dto =
      propertyNotificationBuilder.PROPERTY_BUSINESS_STATUS_CHANGED(payload);

    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(PropertyEvents.ASSIGNED)
  async handlePropertyAssign(payload: PropertyAssignedPayload) {
    const dto = propertyNotificationBuilder.PROPERTY_ASSIGNED(payload);
    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(PropertyEvents.DELETED)
  async handlePropertyDeleted(payload: PropertyDeletedPayload) {
    const dto = propertyNotificationBuilder.PROPERTY_DELETED(payload);
    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(PropertyEvents.UNASSIGNED)
  async handlePropertyUnassign(payload: PropertyUnassignedPayload) {
    const dto = propertyNotificationBuilder.PROPERTY_UNASSIGNED(payload);
    await this.notificationService.notifyUsers(dto);
  }
}
