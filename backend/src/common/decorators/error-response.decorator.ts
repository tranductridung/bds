import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

const ERROR_CONFIG: Record<number, { description: string; message: string }> = {
  400: {
    description: 'Bad Request',
    message: 'Validation failed',
  },
  401: {
    description: 'Unauthorized',
    message: 'Unauthorized',
  },
  403: {
    description: 'Forbidden',
    message: 'Forbidden resource',
  },
  404: {
    description: 'Not Found',
    message: 'Resource not found',
  },
  409: {
    description: 'Conflict',
    message: 'Resource already exists',
  },
  500: {
    description: 'Internal Server Error',
    message: 'Internal server error',
  },
};

export const ApiErrors = (...statuses: number[]) =>
  applyDecorators(
    ...statuses.map((status) => {
      const config = ERROR_CONFIG[status];
      return ApiResponse({
        status,
        description: config.description,
        schema: {
          example: {
            statusCode: status,
            message: {
              message: config.message,
              statusCode: status,
            },
          },
        },
      });
    }),
  );
