import { Type } from 'class-transformer';
import { UserStatus } from 'src/common/enums/enum';
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
