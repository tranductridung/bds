import {
  Injectable,
  CanActivate,
  HttpException,
  ExecutionContext,
} from '@nestjs/common';
import {
  RATE_LIMIT,
  RateLimitConfigType,
} from '../common/decorators/rate-limit.decorator';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();

    const config: RateLimitConfigType = this.reflector.getAllAndOverride(
      RATE_LIMIT,
      [context.getHandler(), context.getClass()],
    ) || {
      limit: Number(this.configService.get<string>('REQUEST_LIMIT_DEFAULT')),
      ttl: Number(this.configService.get<string>('RATE_LIMIT_TTL_DEFAULT')),
    };

    const forwarded = req.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0].trim() || req.ip;

    const key = `rate-limit:${ip}`;

    const increasedValue = await this.redisService.incr(key);

    if (increasedValue === 1) {
      await this.redisService.expire(key, config.ttl);
    }

    if (increasedValue > config.limit) {
      throw new HttpException('Too Many Requests', 429);
    }

    return true;
  }
}
