import {
  Min,
  IsEmail,
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLeadDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirement?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMin: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMax: number | null;
}
