import { OmitType } from '@nestjs/swagger';
import { CreateLeadDto } from './create-lead.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateLeadDto extends OmitType(PartialType(CreateLeadDto), [
  'email',
] as const) {}
