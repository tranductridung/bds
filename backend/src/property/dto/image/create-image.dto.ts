import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateImageDto {
  @ApiProperty({
    description: 'The URL of the image',
    example: 'https://example.com/image.jpg',
  })
  @IsString()
  url!: string;

  @ApiProperty({
    description: 'The original name of the image',
    example: 'image.jpg',
  })
  @IsString()
  originalName!: string;

  @ApiProperty({
    description: 'The public ID of the image',
    example: 'image_public_id',
  })
  @IsString()
  publicId!: string;

  @ApiProperty({
    description: 'The MIME type of the image',
    example: 'image/jpeg',
  })
  @IsString()
  mimeType!: string;

  @ApiProperty({
    description: 'The size of the image in bytes',
    example: 1024,
  })
  @Type(() => Number)
  @IsNumber()
  size!: number;

  @ApiProperty({
    description: 'The width of the image in pixels',
    example: 800,
  })
  @Type(() => Number)
  @IsNumber()
  width!: number;

  @ApiProperty({
    description: 'The height of the image in pixels',
    example: 600,
  })
  @Type(() => Number)
  @IsNumber()
  height!: number;
}
