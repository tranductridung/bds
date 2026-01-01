import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditLogAction } from '../../enums/audit-log.enum';
import { ActivityValue } from '@/src/lead/types/activity-json.type';

export class CreateAuditLogDto {
  @IsEnum(AuditLogAction)
  action: AuditLogAction;

  @IsString()
  targetType: string;

  @IsString()
  targetId: number;

  @IsOptional()
  @IsObject()
  oldValue?: ActivityValue;

  @IsOptional()
  @IsObject()
  newValue?: ActivityValue;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userAgent?: string;

  @Type(() => Number)
  @IsNumber()
  actorId: number;
}
