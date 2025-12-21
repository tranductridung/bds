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
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
