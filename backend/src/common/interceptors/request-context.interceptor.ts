import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req: Request = context.switchToHttp().getRequest();

    req.requestContext = {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: Number(req.statusCode),
    };

    return next.handle();
  }
}
