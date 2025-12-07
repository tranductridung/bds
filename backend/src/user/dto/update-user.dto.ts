import { Type } from 'class-transformer';
import { Gender } from 'src/common/enums/enum';
import { CreateUserDTO } from './create-user.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends OmitType(PartialType(CreateUserDTO), [
  'email',
] as const) {
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dob?: Date;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
