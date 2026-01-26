export enum ReminderProcessStatus {
  PENDING = 'PENDING', // new / not enqueue yet
  SCHEDULING = 'SCHEDULING', // adding job, , use for lock
  SCHEDULED = 'SCHEDULED', // job added
  PROCESSING = 'PROCESSING', // worker processing, use for lock
  SUCCESS = 'SUCCESS', // create notification success
  FAILED = 'FAILED', // create notification failed
}

export enum ReminderStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
}
