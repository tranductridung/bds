export interface BaseAlertPayload {
  receiverIds: number[];
  actorId: number;
}

export interface AccountBannedPayload extends BaseAlertPayload {
  reason: string;
  lockedUntil?: Date;
}

export interface RemoveRolePayload extends BaseAlertPayload {
  oldRole: string;
}
export interface AssignRolePayload extends BaseAlertPayload {
  newRole: string;
}

export interface AssignRolePayload extends BaseAlertPayload {
  role: string;
}
