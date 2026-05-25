import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'The action to be permitted',
    example: 'read',
  })
  @IsString()
  action!: string;

  @ApiProperty({
    description: 'The resource to which the permission applies',
    example: 'users',
  })
  @IsString()
  resource!: string;

  @ApiProperty({
    description: 'A description of the permission',
    example: 'Allows reading user information',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
