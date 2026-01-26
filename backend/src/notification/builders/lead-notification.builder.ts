import {
  NotificationType,
  NotificationObjectType,
} from '../enums/notification.enums';
import {
  LeadDeletedPayload,
  LeadAssignedPayload,
  LeadUnassignedPayload,
  LeadStatusChangedPayload,
  LeadChangePrimaryAgentPayload,
  BaseLeadEventPayload,
} from '@/src/lead/events/lead-core-events.payload';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { LeadNotificationCode } from '../enums/lead-notification-code.enums';

function baseLeadNotification(
  data: BaseLeadEventPayload,
): Pick<
  CreateNotificationDto,
  'type' | 'objectType' | 'objectId' | 'receiverIds' | 'meta'
> {
  return {
    type: NotificationType.ACTIVITY,
    objectType: NotificationObjectType.LEAD,
    objectId: data.leadId,
    receiverIds: data.receiverIds,
    meta: { actorId: data.actorId },
  };
}

export type NotificationPayloadMap = {
  [LeadNotificationCode.LEAD_ASSIGNED]: LeadAssignedPayload;
  [LeadNotificationCode.LEAD_UNASSIGNED]: LeadUnassignedPayload;
  [LeadNotificationCode.LEAD_DELETED]: LeadDeletedPayload;
  [LeadNotificationCode.LEAD_STATUS_CHANGED]: LeadStatusChangedPayload;
  [LeadNotificationCode.LEAD_CHANGE_PRIMARY_AGENT]: LeadChangePrimaryAgentPayload;
};

type NotificationBuilder<C extends LeadNotificationCode> = (
  data: NotificationPayloadMap[C],
) => CreateNotificationDto;

export const leadNotificationBuilder: {
  [C in LeadNotificationCode]: NotificationBuilder<C>;
} = {
  [LeadNotificationCode.LEAD_ASSIGNED]: (data) => ({
    ...baseLeadNotification(data),
    title: 'Agent assigned',
    message: 'You have been assigned to a lead.',
  }),

  [LeadNotificationCode.LEAD_UNASSIGNED]: (data) => ({
    ...baseLeadNotification(data),
    title: 'Agent unassigned',
    message: `You have been unassigned from this lead.`,
  }),

  [LeadNotificationCode.LEAD_DELETED]: (data) => ({
    ...baseLeadNotification(data),
    title: 'Lead deleted',
    message: 'This lead has been deleted.',
  }),

  [LeadNotificationCode.LEAD_STATUS_CHANGED]: (data) => ({
    ...baseLeadNotification(data),
    title: 'Lead status updated',
    message: `Lead status changed from ${data.oldStatus} to ${data.newStatus}.`,
  }),

  [LeadNotificationCode.LEAD_CHANGE_PRIMARY_AGENT]: (data) => ({
    ...baseLeadNotification(data),
    title: 'Change primary agent of lead',
    message: `Primary agent change from #${data.oldPrimaryAgentId} to #${data.newPrimaryAgentId}.`,
  }),
};
