import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '../log/enums/system-log.enum';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createClient, RedisClientType } from 'redis';
import { normalizeError } from '../common/errors/normalize-error';
import { SystemLogEvents } from '../log/system-log/events/system-log.event';
import { ListenerSystemLogPayload } from '../log/system-log/events/system-log-events.payload';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(RedisService.name);
  private client!: RedisClientType;

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST');
    const redisPort = Number(this.configService.get<string>('REDIS_PORT'));

    this.client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error', normalizeError(err));
      const normalizedError = normalizeError(err);

      this.eventEmitter.emit(SystemLogEvents.REDIS_CONNECTION_FAILED, {
        path: undefined,
        method: undefined,
        statusCode: normalizedError.status,
        action: SystemLogAction.REDIS_CONNECTION_FAILED,
        actorId: undefined,
        actorType: SystemLogActorType.SYSTEM,
        targetType: SystemLogTargetType.REDIS,
        targetId: undefined,
        meta: {
          message: normalizedError.message,
          exception: normalizedError.name,
          stack: normalizedError.stack,
        },
      } satisfies ListenerSystemLogPayload);
    });

    try {
      await this.client.connect();
      this.logger.log('Connected to Redis successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', normalizeError(error));
    }
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: number, ttl?: number) {
    return await this.client.set(key, value, ttl ? { EX: ttl } : undefined);
  }

  async setTtl(key: string, ttl: number) {
    return await this.client.expire(key, ttl);
  }

  async delKey(key: string) {
    return await this.client.del(key);
  }

  async incr(key: string) {
    return await this.client.incr(key);
  }

  async expire(key: string, ttl: number) {
    return await this.client.expire(key, ttl);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
