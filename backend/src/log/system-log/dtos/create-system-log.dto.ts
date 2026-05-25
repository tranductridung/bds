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
import { ApiProperty } from '@nestjs/swagger';

export class CreateSystemLogDto {
  @ApiProperty({
    enum: SystemLogLevel,
    description: 'The level of the system log',
  })
  @IsEnum(SystemLogLevel)
  level!: SystemLogLevel;

  @ApiProperty({
    enum: SystemLogAction,
    description: 'The action that triggered the log entry',
  })
  @IsEnum(SystemLogAction)
  action!: SystemLogAction;

  @ApiProperty({
    enum: SystemLogActorType,
    description: 'The type of the actor that triggered the log entry',
  })
  @IsEnum(SystemLogActorType)
  actorType!: SystemLogActorType;

  @ApiProperty({
    description: 'The ID of the actor that triggered the log entry',
    example: 123,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  actorId?: number;

  @ApiProperty({
    enum: SystemLogTargetType,
    description: 'The type of the target entity',
    required: false,
  })
  @IsEnum(SystemLogTargetType)
  @IsOptional()
  targetType?: SystemLogTargetType;

  @ApiProperty({
    description: 'The ID of the target entity',
    example: 'lead-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  targetId?: string;

  @ApiProperty({
    description: 'The path of the request that triggered the log entry',
    example: '/api/v1/leads',
    required: false,
  })
  @IsString()
  @IsOptional()
  path?: string;

  @ApiProperty({
    description: 'The HTTP method of the request that triggered the log entry',
    example: 'GET',
    required: false,
  })
  @IsString()
  @IsOptional()
  method?: string;

  @ApiProperty({
    description: 'The status code of the response',
    example: 200,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  statusCode?: number;

  @ApiProperty({
    description: 'Additional metadata for the log entry',
    example: { userAgent: 'Mozilla/5.0...' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
