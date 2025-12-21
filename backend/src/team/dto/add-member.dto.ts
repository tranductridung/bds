import { Type } from 'class-transformer';
import { IsEnum, IsNumber } from 'class-validator';
import { MemberRole } from '../enums/member-role.enum';

export class AddMemberDto {
  @Type(() => Number)
  @IsNumber()
  memberId: number;

  @Type(() => Number)
  @IsNumber()
  teamId: number;

  @IsEnum(MemberRole)
  role: MemberRole;
}
