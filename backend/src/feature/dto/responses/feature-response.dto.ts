import { ApiProperty } from '@nestjs/swagger';

export class FeatureResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'New Feature' })
  name!: string;

  @ApiProperty({ example: 'new feature' })
  normalizedName!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
