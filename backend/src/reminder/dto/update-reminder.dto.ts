import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSelfReminderDto } from './create-self-reminder.dto';

export class UpdateReminderDto extends OmitType(
  PartialType(CreateSelfReminderDto),
  ['jobId'] as const,
) {}
