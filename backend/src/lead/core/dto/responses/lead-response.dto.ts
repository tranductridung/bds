import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@/src/lead/enums/lead.enum';

export class LeadResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'john.doe@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty({ example: '0123456789' })
  phoneNumber!: string | null;

  @ApiProperty({ example: 'Interested in large rooms' })
  requirement!: string | null;

  @ApiProperty({ example: 1000 })
  budgetMin!: number | null;

  @ApiProperty({ example: 5000 })
  budgetMax!: number | null;

  @ApiProperty({ example: LeadStatus.NEW })
  status!: LeadStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
