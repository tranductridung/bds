import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SystemLogService } from './system-log.service';
import { SystemLogEvents } from './events/system-log.event';
import { ListenerSystemLogPayload } from './events/system-log-events.payload';

@Injectable()
export class SystemLogListener {
  constructor(private systemLogService: SystemLogService) {}
  @OnEvent(SystemLogEvents.AUTH_LOGIN_FAILED) async handleLoginFailed(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.AUTH_ACCOUNT_LOCKED) async handleAccountLocked(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.AUTH_ACCOUNT_BANNED) async handleAccountBanned(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.AUTHZ_ACCESS_DENIED) async handleAccessDenied(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.FILE_UPLOAD_FAILED) async handleUploadFileFailed(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.error(payload);
  }

  @OnEvent(SystemLogEvents.FILE_DOWNLOAD_FAILED)
  async handleDownloadFileFailed(payload: ListenerSystemLogPayload) {
    await this.systemLogService.error(payload);
  } //chưa

  @OnEvent(SystemLogEvents.API_ERROR) async handleApiError(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.error(payload);
  } //chưa

  @OnEvent(SystemLogEvents.JOB_FAILED) async handleJobFailed(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.error(payload);
  }

  @OnEvent(SystemLogEvents.CRON_FAILED) async handleCronFailed(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.error(payload);
  }

  @OnEvent(SystemLogEvents.SECURITY_SUSPICIOUS_ACTIVITY)
  async handleSuspicious(payload: ListenerSystemLogPayload) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.SECURITY_INVALID_PAYLOAD)
  async handleInvalidPayload(payload: ListenerSystemLogPayload) {
    await this.systemLogService.security(payload);
  }

  @OnEvent(SystemLogEvents.SYSTEM_STARTUP) async handleSystemStartup(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.info(payload);
  } //chưa

  @OnEvent(SystemLogEvents.SYSTEM_SHUTDOWN) async handleSystemShutdown(
    payload: ListenerSystemLogPayload,
  ) {
    await this.systemLogService.info(payload);
  } //chưa

  @OnEvent(SystemLogEvents.SYSTEM_UNHANDLED_EXCEPTION)
  async handleUnhanledException(payload: ListenerSystemLogPayload) {
    await this.systemLogService.error(payload);
  }

  @OnEvent(SystemLogEvents.REDIS_CONNECTION_FAILED)
  async handleRedisConnectionFailed(payload: ListenerSystemLogPayload) {
    await this.systemLogService.error(payload);
  }
}
