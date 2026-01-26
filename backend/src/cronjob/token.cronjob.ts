import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';

@Injectable()
export class TokenCleanupCronJob {
  constructor(private refreshTokenService: RefreshTokenService) {}
  @Cron('0 0 * * *')
  async handleTokenCleanup() {
    const now = new Date();

    await this.refreshTokenService.cleanupExpiredTokens(now);
  }
}
