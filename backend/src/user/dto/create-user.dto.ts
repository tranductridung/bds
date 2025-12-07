import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDTO {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  role?: string;
}
