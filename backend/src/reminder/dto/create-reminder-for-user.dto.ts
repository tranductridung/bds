import { IsInt } from 'class-validator';
import { CreateSelfReminderDto } from './create-self-reminder.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReminderForUserDto extends CreateSelfReminderDto {
  @ApiProperty({
    description: 'ID of the user to assign the reminder to',
    example: 123,
  })
  @IsInt()
  assigneeId!: number;
}
