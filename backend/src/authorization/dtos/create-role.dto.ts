import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    example: 'admin',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'A description of the role',
    example: 'Administrator with full access',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
