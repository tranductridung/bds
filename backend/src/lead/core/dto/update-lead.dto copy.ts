import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '../../enums/lead.enum';

export class ChangeLeadStatusDto {
  @ApiProperty({
    description: 'New status for the lead',
    example: LeadStatus.CONTACTED,
  })
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}
