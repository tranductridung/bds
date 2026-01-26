import { IsInt } from 'class-validator';
import { CreateSelfReminderDto } from './create-self-reminder.dto';

export class CreateReminderForUserDto extends CreateSelfReminderDto {
  @IsInt()
  assigneeId: number;
}
