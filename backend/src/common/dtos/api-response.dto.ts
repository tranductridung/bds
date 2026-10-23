import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export function ApiResponseDto<T>(
  DataDto: new () => T,
  options?: {
    isMeta?: boolean;
    isArray?: boolean;
  },
) {
  class ApiResponseClass {
    @ApiProperty({
      type: DataDto,
      isArray: options?.isArray,
    })
    data!: T | T[];
  }

  if (options?.isMeta) {
    ApiPropertyOptional({
      type: 'object',
      additionalProperties: true,
      example: { total: 100, page: 1, limit: 10 },
    })(ApiResponseClass.prototype, 'meta');
  }

  Object.defineProperty(ApiResponseClass, 'name', {
    value: `${DataDto.name}${options?.isMeta ? 'WithMeta' : ''}Response`,
  });

  return ApiResponseClass;
}

export function ApiMessageResponseDto(message: string, schemaName: string) {
  class ApiMessageResponseClass {
    @ApiProperty({ example: { message } })
    data!: { message: string };
  }

  Object.defineProperty(ApiMessageResponseClass, 'name', {
    value: schemaName,
  });

  return ApiMessageResponseClass;
}
