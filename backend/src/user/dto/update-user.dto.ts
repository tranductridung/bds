import { Type } from 'class-transformer';
import { Gender } from '../enums/user.enum';
import { CreateUserDTO } from './create-user.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends OmitType(PartialType(CreateUserDTO), [
  'email',
] as const) {
  @ApiProperty({
    description: 'Date of birth of the user',
    example: '1990-01-01',
    required: false,
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dob?: Date;

  @ApiProperty({
    description: 'Gender of the user',
    enum: Gender,
    example: Gender.FEMALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Address of the user',
    example: '123 Main St, City, State 12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '0123456789',
    required: false,
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: "URL of the user's avatar",
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
