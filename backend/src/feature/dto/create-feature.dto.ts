import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateFeatureDto {
  @ApiProperty({
    description: 'The name of the feature',
    example: 'Swimming Pool',
  })
  @IsString()
  name!: string;
}
