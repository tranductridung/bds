export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  LOST = 'Lost',
}

export enum LeadActivityAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
}

export enum LeadActivityResource {
  LEAD = 'Lead',
  NOTE = 'Note',
  ASSIGNMENT = 'Assignment',
}
