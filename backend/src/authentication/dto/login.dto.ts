import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDTO {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  password!: string;
}
