import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { SystemLog } from './entities/system-log.entity';
import { SystemLogLevel } from '../enums/system-log.enum';
import { CreateSystemLogDto } from './dtos/create-system-log.dto';

@Injectable()
export class SystemLogService {
  constructor(private readonly dataSource: DataSource) {}

  async log(dto: CreateSystemLogDto): Promise<void> {
    try {
      await this.dataSource.getRepository(SystemLog).save({
        level: dto.level,
        event: dto.event,
        path: dto.path,
        method: dto.method,
        meta: dto.meta,
        actor: dto.actorId ? { id: dto.actorId } : undefined,
      });
    } catch {}
  }

  async logSecurity(
    event: string,
    payload: Omit<CreateSystemLogDto, 'level' | 'event'>,
  ): Promise<void> {
    await this.log({
      level: SystemLogLevel.SECURITY,
      event,
      ...payload,
    });
  }

  async logError(
    event: string,
    payload: Omit<CreateSystemLogDto, 'level' | 'event'>,
  ): Promise<void> {
    await this.log({
      level: SystemLogLevel.ERROR,
      event,
      ...payload,
    });
  }

  async logWarn(
    event: string,
    payload: Omit<CreateSystemLogDto, 'level' | 'event'>,
  ): Promise<void> {
    await this.log({
      level: SystemLogLevel.WARN,
      event,
      ...payload,
    });
  }
}
