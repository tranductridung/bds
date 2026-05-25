import { IsInt, IsArray, ArrayNotEmpty } from 'class-validator';
import { CreateRawNotificationDto } from './create-raw-notification.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto extends CreateRawNotificationDto {
  @ApiProperty({
    description: 'List of receiver user IDs',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  receiverIds!: number[];
}
