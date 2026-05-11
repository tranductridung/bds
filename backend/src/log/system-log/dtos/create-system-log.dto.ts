import {
  IsEnum,
  IsNumber,
  IsString,
  IsObject,
  IsOptional,
} from 'class-validator';
import {
  SystemLogLevel,
  SystemLogAction,
  SystemLogTargetType,
  SystemLogActorType,
} from '../../enums/system-log.enum';
import { Type } from 'class-transformer';

export class CreateSystemLogDto {
  @IsEnum(SystemLogLevel)
  level: SystemLogLevel;

  @IsEnum(SystemLogAction)
  action: SystemLogAction;

  @IsEnum(SystemLogActorType)
  actorType: SystemLogActorType;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  actorId?: number;

  @IsEnum(SystemLogTargetType)
  @IsOptional()
  targetType?: SystemLogTargetType;

  @IsString()
  @IsOptional()
  targetId?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  method?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
