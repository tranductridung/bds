import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { CreateRawNotificationDto } from './create-raw-notification.dto';

export class CreateNotificationDto extends CreateRawNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  receiverIds: number[];
}
