import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  Max,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating value for the property',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiProperty({
    description: 'Optional comment about the property',
    example: 'Great location and amenities!',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
