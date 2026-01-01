export enum AuditLogAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  OTHER = 'Other',
}

export enum SystemLogAction {
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  LOGIN = 'Login',
  LOGOUT = 'Logout',
  OTHER = 'Other',
}

export enum AuditLogTargetType {
  FEATURE = 'feature',

  PROPERTY = 'property',
  PROPERTY_FEATURE = 'property feature',
  PROPERTY_AGENT = 'property agent',
  PROPERTY_IMAGE = 'property image',
  PROPERTY_RATING = 'property rating',

  LEAD = 'lead',
  LEAD_ASSIGNMENT = 'lead assignment',
  LEAD_NOTE = 'lead note',
  LEAD_ACTIVITY = 'lead activity',

  TEAM = 'team',
  TEAM_MEMBER = 'team member',
}
