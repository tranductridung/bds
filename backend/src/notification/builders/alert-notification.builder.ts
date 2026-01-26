import {
  BaseAlertPayload,
  RemoveRolePayload,
  AssignRolePayload,
  AccountBannedPayload,
} from '../events/alert.payload';
import { NotificationType } from '../enums/notification.enums';
import { AlertCode } from '../enums/alert-notification-code.enums';
import { CreateNotificationDto } from '../dtos/create-notification.dto';

function baseAlert(
  data: BaseAlertPayload,
): Pick<CreateNotificationDto, 'type' | 'receiverIds'> {
  return {
    type: NotificationType.ALERT,
    receiverIds: data.receiverIds,
  };
}

export type AlertPayloadMap = {
  [AlertCode.AUTHEN_ACCOUNT_BANNED]: AccountBannedPayload;
  [AlertCode.AUTHOR_ROLE_REMOVED]: RemoveRolePayload;
  [AlertCode.AUTHOR_ROLE_ASSIGNED]: AssignRolePayload;
};

type AlertBuilder<C extends AlertCode> = (
  data: AlertPayloadMap[C],
) => CreateNotificationDto;

export const alertBuilder: {
  [C in AlertCode]: AlertBuilder<C>;
} = {
  [AlertCode.AUTHEN_ACCOUNT_BANNED]: (data) => ({
    ...baseAlert(data),
    title: 'Account banned',
    message: buildAccountBannedMessage(data),
    meta: {
      actorId: data.actorId,
      reason: data.reason,
    },
  }),

  [AlertCode.AUTHOR_ROLE_REMOVED]: (data) => ({
    ...baseAlert(data),
    title: 'Unassign removed',
    message: `Your role was unassign.`,
    meta: {
      oldRole: data.oldRole,
      actorId: data.actorId,
    },
  }),

  [AlertCode.AUTHOR_ROLE_ASSIGNED]: (data) => ({
    ...baseAlert(data),
    title: 'Assign role',
    message: `You have been assigned ${data.newRole} role.`,
    meta: {
      newRole: data.newRole,
      actorId: data.actorId,
    },
  }),
};

function buildAccountBannedMessage(data: AccountBannedPayload): string {
  let message = `Your account has been banned due to ${data.reason}`;

  if (data.lockedUntil) {
    message += `. It will be unlocked at ${data.lockedUntil.toLocaleString()}`;
  }

  return `${message}.`;
}
