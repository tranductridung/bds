import { HttpException } from '@nestjs/common';
import { NormalizedError } from './normalize-error.interface';

export function normalizeError(exception: unknown): NormalizedError {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();

    const message =
      typeof response === 'string'
        ? response
        : typeof response === 'object' &&
            response !== null &&
            'message' in response
          ? String((response as { message: unknown }).message)
          : exception.message;

    return {
      status: exception.getStatus(),
      name: exception.name,
      message: message,
      stack: exception.stack,
    };
  }

  if (exception instanceof Error) {
    return {
      status: 500,
      name: exception.name,
      message: exception.message,
      stack: exception.stack,
    };
  }

  return {
    status: 500,
    name: 'Unknown Error',
    message: typeof exception === 'string' ? exception : 'Unknown error',
  };
}
