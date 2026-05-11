import { DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { SystemLog } from './entities/system-log.entity';
import { SystemLogLevel } from '../enums/system-log.enum';
import { CreateSystemLogDto } from './dtos/create-system-log.dto';
@Injectable()
export class SystemLogService {
  private readonly logger = new Logger(SystemLogService.name);

  constructor(private readonly dataSource: DataSource) {}

  async createLog(dto: CreateSystemLogDto): Promise<void> {
    try {
      await this.dataSource.getRepository(SystemLog).save({
        level: dto.level,
        action: dto.action,
        path: dto.path,
        method: dto.method,
        statusCode: dto.statusCode,
        targetType: dto.targetType,
        targetId: dto.targetId,
        meta: dto.meta,
        actorId: dto.actorId,
      });
    } catch (error) {
      // ❗ log internal only – never throw
      this.logger.error('Failed to write system log', error);
    }
  }

  error(payload: Omit<CreateSystemLogDto, 'level'>) {
    return this.createLog({ level: SystemLogLevel.ERROR, ...payload });
  }

  warn(payload: Omit<CreateSystemLogDto, 'level'>) {
    return this.createLog({ level: SystemLogLevel.WARN, ...payload });
  }

  security(payload: Omit<CreateSystemLogDto, 'level'>) {
    return this.createLog({ level: SystemLogLevel.SECURITY, ...payload });
  }

  info(payload: Omit<CreateSystemLogDto, 'level'>) {
    return this.createLog({ level: SystemLogLevel.INFO, ...payload });
  }
}
