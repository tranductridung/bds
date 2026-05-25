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
import { ApiProperty } from '@nestjs/swagger';

export class CreateAuditLogDto {
  @ApiProperty({
    enum: AuditLogAction,
    description: 'The type of action performed',
  })
  @IsEnum(AuditLogAction)
  action!: AuditLogAction;

  @ApiProperty({
    description: 'The type of the target entity',
    example: 'Lead',
  })
  @IsString()
  targetType!: string;

  @ApiProperty({
    description: 'The ID of the target entity',
  })
  @IsString()
  targetId!: number;

  @ApiProperty({
    description: 'The old value before the change (if applicable)',
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  oldValue?: ActivityValue;

  @ApiProperty({
    description: 'The new value after the change (if applicable)',
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  newValue?: ActivityValue;

  @ApiProperty({
    description: 'A description of the action performed',
    example: 'Updated lead status from "New" to "Contacted"',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The IP address of the user performing the action',
    example: '192.168.1.1',
  })
  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string;

  @ApiProperty({
    description: 'The user agent of the user performing the action',
    example:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  userAgent?: string;

  @ApiProperty({
    description: 'The ID of the user performing the action',
    example: 123,
  })
  @Type(() => Number)
  @IsNumber()
  actorId!: number;
}
