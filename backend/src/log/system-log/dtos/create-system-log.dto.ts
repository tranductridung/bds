import { SystemLogLevel } from '../../enums/system-log.enum';

export class CreateSystemLogDto {
  level: SystemLogLevel;
  event: string;

  actorId?: number;
  path?: string;
  method?: string;

  meta?: Record<string, any>;
}
