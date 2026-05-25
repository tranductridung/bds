import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export function ApiResponseDto<T>(DataDto: new () => T, isMeta = false) {
  class ApiResponseClass {
    @ApiProperty({ type: DataDto })
    data!: T;
  }

  if (isMeta) {
    ApiPropertyOptional({
      type: 'object',
      additionalProperties: true,
      example: { total: 100, page: 1, limit: 10 },
    })(ApiResponseClass.prototype, 'meta');
  }

  Object.defineProperty(ApiResponseClass, 'name', {
    value: `${DataDto.name}${isMeta ? 'WithMeta' : ''}Response`,
  });

  return ApiResponseClass;
}
