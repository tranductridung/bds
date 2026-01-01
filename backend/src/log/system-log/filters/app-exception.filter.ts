import {
  Catch,
  HttpStatus,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SystemLogService } from '../system-log.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly systemLogService: SystemLogService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? (exception.getStatus() as HttpStatus)
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const user = req.user as { id?: number } | undefined;

    // 🔐 SECURITY LOG
    if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
      const exceptionName =
        exception instanceof Error ? exception.name : 'UnknownException';

      await this.systemLogService.logSecurity('ACCESS_DENIED', {
        actorId: user?.id,
        path: req.originalUrl,
        method: req.method,
        meta: {
          status,
          exception: exceptionName,
        },
      });
    }

    // 💥 ERROR LOG
    if ((status as number) >= 500) {
      await this.systemLogService.logError('UNHANDLED_EXCEPTION', {
        actorId: user?.id,
        path: req.originalUrl,
        method: req.method,
        meta: {
          status,
          exception:
            exception instanceof Error ? exception.message : String(exception),
        },
      });
    }

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      return res.status(status).json(response);
    }

    return res.status(status).json({
      statusCode: status,
      message: 'Internal server error',
    });
  }
}
