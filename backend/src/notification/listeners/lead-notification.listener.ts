import {
  LeadDeletedPayload,
  LeadAssignedPayload,
  LeadUnassignedPayload,
  LeadStatusChangedPayload,
  LeadChangePrimaryAgentPayload,
} from '@/src/lead/events/lead-core-events.payload';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LeadEvents } from '@/src/lead/events/lead.event';
import { NotificationService } from '../notification.service';
import { leadNotificationBuilder } from '../builders/lead-notification.builder';

@Injectable()
export class LeadNotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent(LeadEvents.STATUS_CHANGED)
  async handleChangeLeadStatus(payload: LeadStatusChangedPayload) {
    const dto = leadNotificationBuilder.LEAD_STATUS_CHANGED(payload);

    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(LeadEvents.ASSIGNED)
  async handleLeadAssign(payload: LeadAssignedPayload) {
    const dto = leadNotificationBuilder.LEAD_ASSIGNED(payload);
    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(LeadEvents.DELETED)
  async handleLeadDeleted(payload: LeadDeletedPayload) {
    const dto = leadNotificationBuilder.LEAD_DELETED(payload);
    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(LeadEvents.UNASSIGNED)
  async handleLeadUnassign(payload: LeadUnassignedPayload) {
    const dto = leadNotificationBuilder.LEAD_UNASSIGNED(payload);
    await this.notificationService.notifyUsers(dto);
  }

  @OnEvent(LeadEvents.PRIMARY_AGENT_CHANGED)
  async handleLeadChangePrimaryAgent(payload: LeadChangePrimaryAgentPayload) {
    const dto = leadNotificationBuilder.LEAD_CHANGE_PRIMARY_AGENT(payload);
    await this.notificationService.notifyUsers(dto);
  }
}
