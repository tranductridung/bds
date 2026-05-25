import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    type: Object,
    description: 'Authenticated user object',
    example: { sub: 123 },
  })
  user!: { sub: number };
}
