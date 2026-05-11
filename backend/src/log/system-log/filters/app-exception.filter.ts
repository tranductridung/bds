import {
  Catch,
  HttpException,
  ArgumentsHost,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  SystemLogAction,
  SystemLogActorType,
  SystemLogTargetType,
} from '../../enums/system-log.enum';
import { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemLogEvents } from '../events/system-log.event';
import { ListenerSystemLogPayload } from '../events/system-log-events.payload';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req: Request = ctx.getRequest<Request>();
    const res: Response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const actorId = req?.user?.id;

    const basePayload: Pick<
      ListenerSystemLogPayload,
      'path' | 'method' | 'statusCode'
    > = {
      path: req.originalUrl,
      method: req.method,
      statusCode: status,
    };

    if (exception instanceof UnauthorizedException) {
      this.eventEmitter.emit(SystemLogEvents.AUTHZ_ACCESS_DENIED, {
        ...basePayload,
        action: SystemLogAction.AUTHENTICATION_FAILED,
        actorId: undefined,
        actorType: SystemLogActorType.ANONYMOUS,
        targetType: SystemLogTargetType.AUTH,
        targetId: undefined,
        meta: { exception: exception.name },
      } satisfies ListenerSystemLogPayload);
    } else if (exception instanceof ForbiddenException) {
      this.eventEmitter.emit(SystemLogEvents.AUTHZ_ACCESS_DENIED, {
        ...basePayload,
        action: SystemLogAction.AUTHORIZATION_FAILED,
        actorId,
        actorType: actorId
          ? SystemLogActorType.USER
          : SystemLogActorType.ANONYMOUS,
        targetType: SystemLogTargetType.API,
        targetId: undefined,
        meta: { exception: exception.name },
      } satisfies ListenerSystemLogPayload);
    } else if (exception instanceof HttpException && status === 429) {
      this.eventEmitter.emit(SystemLogEvents.SECURITY_RATE_LIMIT_EXCEEDED, {
        ...basePayload,
        action: SystemLogAction.SECURITY_RATE_LIMIT_EXCEEDED,
        actorId,
        actorType: actorId
          ? SystemLogActorType.USER
          : SystemLogActorType.ANONYMOUS,
        targetType: SystemLogTargetType.REDIS,
        targetId: undefined,
        meta: { exception: exception.name },
      } satisfies ListenerSystemLogPayload);
    } else if (status >= 500) {
      this.eventEmitter.emit(SystemLogEvents.SYSTEM_UNHANDLED_EXCEPTION, {
        ...basePayload,
        action: SystemLogAction.SYSTEM_UNHANDLED_EXCEPTION,
        actorType: SystemLogActorType.SYSTEM,
        actorId: undefined,
        targetType: SystemLogTargetType.SYSTEM,
        targetId: undefined,
        meta: {
          exception: exception instanceof Error ? exception.name : 'Unknown',
        },
      } satisfies ListenerSystemLogPayload);
    }

    res.status(status).json({
      statusCode: status,
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error',
    });
  }
}
