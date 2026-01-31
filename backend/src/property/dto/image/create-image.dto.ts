import { Type } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class CreateImageDto {
  @IsString()
  url: string;

  @IsString()
  originalName: string;

  @IsString()
  publicId: string;

  @IsString()
  mimeType: string;

  @Type(() => Number)
  @IsNumber()
  size: number;

  @Type(() => Number)
  @IsNumber()
  width: number;

  @Type(() => Number)
  @IsNumber()
  height: number;
}
