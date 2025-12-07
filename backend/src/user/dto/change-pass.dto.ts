import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDTO {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
