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
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({
    description: 'Email address of the lead',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Full name of the lead',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({
    description: 'Phone number of the lead',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  phoneNumber?: string;

  @ApiProperty({
    description: 'Requirements of the lead',
    example: 'I am looking for a house with a garden.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  requirement?: string;

  @ApiProperty({
    description: 'Minimum budget for the lead',
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMin!: number | null;

  @ApiProperty({
    description: 'Maximum budget for the lead',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  budgetMax!: number | null;
}
