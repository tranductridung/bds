import { Type } from 'class-transformer';
import { UserStatus } from '../enums/user.enum';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusRoleDTO {
  @ApiProperty({
    description: 'ID of the role to assign to the user',
    example: 2,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  roleId?: number;

  @ApiProperty({
    description: 'Status of the user',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
