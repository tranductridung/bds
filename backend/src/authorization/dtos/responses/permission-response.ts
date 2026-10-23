import { ApiProperty } from '@nestjs/swagger';
import { Level } from '../../enums/authorization.enum';

export class PermissionResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'create' })
  action!: string;

  @ApiProperty({ example: 'users' })
  resource!: string;

  @ApiProperty({ example: 'create:users' })
  key!: string;

  @ApiProperty({ type: () => Level, example: Level.BUSINESS })
  level!: Level;
}
