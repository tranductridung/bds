import {
  PropertySystemStatus,
  PropertyBusinessStatus,
} from '../enums/property.enum';

export interface BasePropertyEventPayload {
  propertyId: number;
  receiverIds: number[];
  actorId: number;
}

export interface PropertySystemStatusChangedPayload extends BasePropertyEventPayload {
  oldStatus: PropertySystemStatus;
  newStatus: PropertySystemStatus;
}

export interface PropertyBusinessStatusChangedPayload extends BasePropertyEventPayload {
  oldStatus: PropertyBusinessStatus;
  newStatus: PropertyBusinessStatus;
}

export interface PropertyDeletedPayload extends BasePropertyEventPayload {}

export interface PropertyAssignedPayload extends BasePropertyEventPayload {
  agentId: number;
}

export interface PropertyUnassignedPayload extends BasePropertyEventPayload {
  agentId: number;
}

export interface PropertyLowRatingPayload extends BasePropertyEventPayload {
  rating: number;
}
