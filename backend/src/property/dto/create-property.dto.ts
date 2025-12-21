import { Transform, Type } from 'class-transformer';
import { Max, Min, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @Transform(({ value }): string => {
    return typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : String(value ?? '');
  })
  name: string;

  @IsString()
  @Transform(({ value }): string => {
    return typeof value === 'string'
      ? value.trim().replace(/\s+/g, ' ')
      : String(value ?? '');
  })
  type: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsOptional()
  @IsString()
  description?: string;
}
