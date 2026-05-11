import { SystemLogAction } from '../../enums/system-log.enum';
import { SystemLogEvent, SystemLogEvents } from './../events/system-log.event';

export const SYSTEM_LOG_EVENT_ACTION_MAP = {
  /* ========== AUTH ========== */
  [SystemLogEvents.AUTH_LOGIN_FAILED]: SystemLogAction.AUTHENTICATION_FAILED,

  [SystemLogEvents.AUTH_ACCOUNT_LOCKED]: SystemLogAction.AUTH_ACCOUNT_LOCKED,

  [SystemLogEvents.AUTH_ACCOUNT_BANNED]: SystemLogAction.AUTH_ACCOUNT_BANNED,

  [SystemLogEvents.AUTHZ_ACCESS_DENIED]: SystemLogAction.AUTHORIZATION_FAILED,

  /* ========== FILE ========== */
  [SystemLogEvents.FILE_UPLOAD_FAILED]: SystemLogAction.FILE_OPERATION_FAILED,

  [SystemLogEvents.FILE_DOWNLOAD_FAILED]: SystemLogAction.FILE_OPERATION_FAILED,

  /* ========== API ========== */
  [SystemLogEvents.API_ERROR]: SystemLogAction.API_INTERNAL_ERROR,

  /* ========== JOB ========== */
  [SystemLogEvents.JOB_FAILED]: SystemLogAction.JOB_FAILED,

  [SystemLogEvents.JOB_STALLED]: SystemLogAction.JOB_STALLED,

  /* ========== CRON ========== */
  [SystemLogEvents.CRON_FAILED]: SystemLogAction.CRON_FAILED,
  [SystemLogEvents.CRON_SKIPPED]: SystemLogAction.CRON_SKIPPED,
  [SystemLogEvents.CRON_TIMEOUT]: SystemLogAction.CRON_TIMEOUT,

  /* ========== SECURITY ========== */
  [SystemLogEvents.SECURITY_SUSPICIOUS_ACTIVITY]:
    SystemLogAction.SECURITY_SUSPICIOUS_ACTIVITY,

  [SystemLogEvents.SECURITY_INVALID_PAYLOAD]:
    SystemLogAction.SECURITY_INVALID_PAYLOAD,

  [SystemLogEvents.SECURITY_RATE_LIMIT_EXCEEDED]:
    SystemLogAction.SECURITY_RATE_LIMIT_EXCEEDED,
  /* ========== SYSTEM ========== */
  [SystemLogEvents.SYSTEM_STARTUP]: SystemLogAction.SYSTEM_STARTUP,

  [SystemLogEvents.SYSTEM_SHUTDOWN]: SystemLogAction.SYSTEM_SHUTDOWN,

  [SystemLogEvents.SYSTEM_UNHANDLED_EXCEPTION]:
    SystemLogAction.SYSTEM_UNHANDLED_EXCEPTION,

  /* ========== REDIS ========== */
  [SystemLogEvents.REDIS_CONNECTION_FAILED]:
    SystemLogAction.REDIS_CONNECTION_FAILED,
} satisfies Record<SystemLogEvent, SystemLogAction>;
