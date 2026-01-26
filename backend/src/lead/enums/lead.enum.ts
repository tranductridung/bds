export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  LOST = 'LOST',
}

export enum LeadActivityAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum LeadActivityResource {
  LEAD = 'LEAD',
  NOTE = 'NOTE',
  ASSIGNMENT = 'ASSIGNMENT',
}
