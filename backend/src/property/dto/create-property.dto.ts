import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { Max, Min, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePropertyDto {
  @ApiProperty({
    description: 'Name of the property',
    example: 'Cozy 2-bedroom apartment in downtown',
  })
  @IsString()
  @Transform(({ value }): string => {
    return typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : String(value ?? '');
  })
  name!: string;

  @ApiProperty({
    description: 'Type of the property',
    example: 'Apartment',
  })
  @IsString()
  @Transform(({ value }): string => {
    return typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : String(value ?? '');
  })
  type!: string;

  @ApiProperty({
    description: 'Price for the property',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({
    description: 'Latitude of the property',
    minimum: -90,
    maximum: 90,
    example: 40.7128,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({
    description: 'Longitude of the property',
    minimum: -180,
    maximum: 180,
    example: -74.006,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiProperty({
    description: 'Detailed description of the property',
    example:
      'This apartment features 2 bedrooms, 1 bathroom, and a modern kitchen. Located in the heart of downtown.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
