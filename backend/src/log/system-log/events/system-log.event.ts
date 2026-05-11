export const SystemLogEvents = {
  /* ================= AUTH ================= */
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_ACCOUNT_LOCKED: 'auth.account.locked',
  AUTH_ACCOUNT_BANNED: 'auth.account.banned',

  /* ================= AUTHORIZATION ================= */
  AUTHZ_ACCESS_DENIED: 'authz.access.denied',

  /* ================= FILE ================= */
  FILE_UPLOAD_FAILED: 'file.upload.failed',
  FILE_DOWNLOAD_FAILED: 'file.download.failed',

  /* ================= API ================= */
  API_ERROR: 'api.error',

  /* ================= JOB ================= */
  JOB_FAILED: 'job.failed',
  JOB_STALLED: 'job.stalled',

  /* ================= CRON ================= */
  CRON_FAILED: 'cron.failed',
  CRON_SKIPPED: 'cron.skipped',
  CRON_TIMEOUT: 'cron.timeout',

  /* ================= SECURITY ================= */
  SECURITY_SUSPICIOUS_ACTIVITY: 'security.suspicious.activity',
  SECURITY_INVALID_PAYLOAD: 'security.invalid.payload',
  SECURITY_RATE_LIMIT_EXCEEDED: 'security.rate-limit.exceeded',

  /* ================= SYSTEM ================= */
  SYSTEM_STARTUP: 'system.startup',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  SYSTEM_UNHANDLED_EXCEPTION: 'system.unhandled.exception',

  /* ================= REDIS ================= */
  REDIS_CONNECTION_FAILED: 'redis.connection.failed',
} as const;

export type SystemLogEvent =
  (typeof SystemLogEvents)[keyof typeof SystemLogEvents];
