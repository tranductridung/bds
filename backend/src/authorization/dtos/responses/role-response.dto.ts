import { ApiProperty } from '@nestjs/swagger';

export class RoleResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'admin' })
  name!: string;

  @ApiProperty({ example: 'Administrator role with full privileges' })
  description!: string | null;

  @ApiProperty({ example: false })
  isSystem!: boolean;
}
