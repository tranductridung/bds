import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT = 'rate_limit';

export type RateLimitConfigType = {
  limit: number;
  ttl: number;
};

export const RateLimit = (config: RateLimitConfigType) =>
  SetMetadata(RATE_LIMIT, config);
