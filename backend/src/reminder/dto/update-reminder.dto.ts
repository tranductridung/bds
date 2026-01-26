import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateSelfReminderDto } from './create-self-reminder.dto';

export class UpdateReminderDto extends OmitType(
  PartialType(CreateSelfReminderDto),
  ['jobId'] as const,
) {}
