import { Type } from 'class-transformer';
import { UserStatus } from '../enums/user.enum';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

export class UpdateStatusRoleDTO {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  roleId?: number;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
