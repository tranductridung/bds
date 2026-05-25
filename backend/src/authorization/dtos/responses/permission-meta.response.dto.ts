import { ApiProperty } from '@nestjs/swagger';

export class PermissionMetaResponseDto {
  @ApiProperty({ example: ['create', 'read', 'update', 'delete'] })
  actions!: string[];

  @ApiProperty({ example: ['users', 'roles', 'permissions'] })
  resources!: string[];
}
