import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDTO {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'currentPassword123',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: 'New password for the user',
    example: 'newPassword123',
  })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
