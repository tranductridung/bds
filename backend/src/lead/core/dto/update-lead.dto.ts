import { CreateLeadDto } from './create-lead.dto';
import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdateLeadDto extends PartialType(
  OmitType(CreateLeadDto, ['email'] as const),
) {}
