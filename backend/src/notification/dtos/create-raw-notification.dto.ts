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

export class CreateRawNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsEnum(NotificationObjectType)
  objectType?: NotificationObjectType;

  @IsOptional()
  @IsInt()
  @Min(1)
  objectId?: number;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}
