import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
