import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PaginationDto {
  @ApiProperty({
    description: 'The page number to retrieve',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiProperty({
    description: 'The number of items to retrieve per page',
    example: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  limit?: number;

  @ApiProperty({
    description: 'A search query to filter results',
    example: 'house',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
