import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The reset password token',
    example: 'reset-token-example',
  })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({
    description: 'The new password',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
