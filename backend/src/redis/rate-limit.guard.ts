import {
  Injectable,
  CanActivate,
  HttpException,
  ExecutionContext,
  HttpStatus,
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
    const enabled = this.configService.get<boolean | string>(
      'RATE_LIMIT_ENABLED',
    );
    if (enabled === false || enabled === 'false') {
      return true;
    }

    const req: Request = context.switchToHttp().getRequest();

    const config: RateLimitConfigType = this.reflector.getAllAndOverride(
      RATE_LIMIT,
      [context.getHandler(), context.getClass()],
    ) || {
      limit: Number(this.configService.get<string>('REQUEST_LIMIT_DEFAULT')),
      ttl: Number(this.configService.get<string>('RATE_LIMIT_TTL_DEFAULT')),
    };

    const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const routeId = `${context.getClass().name}.${context.getHandler().name}`;
    const prefix = this.configService.get<string>('REDIS_KEY_PREFIX') ?? 'app';
    const key = `${prefix}:rate-limit:${routeId}:ip:${ip}`;

    const result = await this.redisService.incrWithTtl(key, config.ttl);

    if (result.count > config.limit) {
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
