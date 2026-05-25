import {
  Min,
  IsInt,
  IsEnum,
  IsString,
  IsObject,
  MaxLength,
  IsOptional,
} from 'class-validator';
import {
  NotificationType,
  NotificationObjectType,
} from '../enums/notification.enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRawNotificationDto {
  @ApiProperty({
    description: 'The type of the notification',
    enum: NotificationType,
    example: NotificationType.SYSTEM,
  })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({
    description: 'The title of the notification',
    example: 'Info Notification',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({
    description: 'The message of the notification',
    example: 'This is an info notification',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  message!: string;

  @ApiProperty({
    description: 'The type of the notification object',
    enum: NotificationObjectType,
    example: NotificationObjectType.USER,
    required: false,
  })
  @IsOptional()
  @IsEnum(NotificationObjectType)
  objectType?: NotificationObjectType;

  @ApiProperty({
    description: 'The ID of the notification object',
    example: 123,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  objectId?: number;

  @ApiProperty({
    description: 'Additional metadata for the notification',
    type: Object,
    example: { key: 'value' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
