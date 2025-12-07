import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  action: string;

  @IsString()
  resource: string;

  @IsString()
  @IsOptional()
  description?: string;
}
