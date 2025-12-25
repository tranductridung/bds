import { PartialType } from '@nestjs/mapped-types';
import { CreateLeadActivityDto } from './create-lead-activity.dto';

export class UpdateLeadActivityDto extends PartialType(CreateLeadActivityDto) {}
