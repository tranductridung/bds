import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '../log/enums/system-log.enum';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { SystemLogEvents } from '../log/system-log/events/system-log.event';
import { ListenerSystemLogPayload } from '../log/system-log/events/system-log-events.payload';

@Injectable()
export class TokenCleanupCronJob {
  private readonly logger = new Logger(TokenCleanupCronJob.name);

  constructor(
    private refreshTokenService: RefreshTokenService,
    private eventEmitter: EventEmitter2,
  ) {}
  @Cron('0 0 * * *')
  async handleTokenCleanup() {
    try {
      const now = new Date();
      await this.refreshTokenService.cleanupExpiredTokens(now);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(message, stack);

      let statusCode: number | undefined;

      if (error instanceof HttpException) {
        statusCode = error.getStatus();
      }

      this.eventEmitter.emit(SystemLogEvents.CRON_FAILED, {
        action: SystemLogAction.CRON_FAILED,
        actorId: undefined,
        actorType: SystemLogActorType.SYSTEM,
        targetType: SystemLogTargetType.CRON,
        targetId: undefined,
        path: undefined,
        method: undefined,
        statusCode,
      } satisfies ListenerSystemLogPayload);

      this.logger.error(`Failed to clean up expired tokens: ${message}`);
    }
  }
}
