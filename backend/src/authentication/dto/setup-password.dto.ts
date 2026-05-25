import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SetupPasswordDto {
  @ApiProperty({
    description: 'The new password to set up',
    example: 'newpassword123',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
