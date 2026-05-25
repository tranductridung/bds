import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateLeadNoteDto {
  @ApiProperty({
    description: 'The content of the lead note',
    example: 'Contacted the lead, waiting for response.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  content!: string;
}
