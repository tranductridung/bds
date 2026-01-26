import { LeadStatus } from '../enums/lead.enum';

export interface BaseLeadEventPayload {
  leadId: number;
  receiverIds: number[];
  actorId: number;
}

export interface LeadStatusChangedPayload extends BaseLeadEventPayload {
  oldStatus: LeadStatus;
  newStatus: LeadStatus;
}

export interface LeadDeletedPayload extends BaseLeadEventPayload {}

export interface LeadAssignedPayload extends BaseLeadEventPayload {
  agentId: number;
}

export interface LeadUnassignedPayload extends BaseLeadEventPayload {
  agentId: number;
}

export interface LeadChangePrimaryAgentPayload extends BaseLeadEventPayload {
  oldPrimaryAgentId: number;
  newPrimaryAgentId: number;
}
