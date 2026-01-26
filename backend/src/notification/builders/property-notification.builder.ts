import {
  NotificationType,
  NotificationObjectType,
} from '../enums/notification.enums';
import {
  PropertyDeletedPayload,
  PropertyAssignedPayload,
  BasePropertyEventPayload,
  PropertyLowRatingPayload,
  PropertyUnassignedPayload,
  PropertySystemStatusChangedPayload,
  PropertyBusinessStatusChangedPayload,
} from './../../property/events/property-core-events.payload';
import { CreateNotificationDto } from '../dtos/create-notification.dto';
import { PropertyNotificationCode } from '../enums/property-notification-code.enums';

function basePropertyNotification(
  data: BasePropertyEventPayload,
): Pick<
  CreateNotificationDto,
  'type' | 'objectType' | 'objectId' | 'receiverIds' | 'meta'
> {
  return {
    type: NotificationType.ACTIVITY,
    objectType: NotificationObjectType.PROPERTY,
    objectId: data.propertyId,
    receiverIds: data.receiverIds,
    meta: { actorId: data.actorId },
  };
}
export type NotificationPayloadMap = {
  [PropertyNotificationCode.PROPERTY_ASSIGNED]: PropertyAssignedPayload;
  [PropertyNotificationCode.PROPERTY_UNASSIGNED]: PropertyUnassignedPayload;
  [PropertyNotificationCode.PROPERTY_DELETED]: PropertyDeletedPayload;
  [PropertyNotificationCode.PROPERTY_SYSTEM_STATUS_CHANGED]: PropertySystemStatusChangedPayload;
  [PropertyNotificationCode.PROPERTY_BUSINESS_STATUS_CHANGED]: PropertyBusinessStatusChangedPayload;
  [PropertyNotificationCode.PROPERTY_LOW_RATING]: PropertyLowRatingPayload;
};

type NotificationBuilder<C extends PropertyNotificationCode> = (
  data: NotificationPayloadMap[C],
) => CreateNotificationDto;

export const propertyNotificationBuilder: {
  [C in PropertyNotificationCode]: NotificationBuilder<C>;
} = {
  // PROPERTY
  [PropertyNotificationCode.PROPERTY_ASSIGNED]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Agent assigned',
    message: 'You have been assigned to a property.',
  }),

  [PropertyNotificationCode.PROPERTY_UNASSIGNED]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Agent unassigned',
    message: `You have been unassigned from this property.`,
  }),

  [PropertyNotificationCode.PROPERTY_DELETED]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Property deleted',
    message: `This property has been deleted.`,
  }),

  [PropertyNotificationCode.PROPERTY_SYSTEM_STATUS_CHANGED]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Property system status updated',
    message: `System status changed from ${data.oldStatus} to ${data.newStatus}.`,
  }),

  [PropertyNotificationCode.PROPERTY_BUSINESS_STATUS_CHANGED]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Property business status updated',
    message: `Business status changed from ${data.oldStatus} to ${data.newStatus}.`,
  }),

  [PropertyNotificationCode.PROPERTY_LOW_RATING]: (data) => ({
    ...basePropertyNotification(data),
    title: 'Property rating is low',
    message: `This property has a low rating (${data.rating}).`,
  }),
};
