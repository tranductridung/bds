import {
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { tap } from 'rxjs';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../audit-log.service';
import { AuditLogAction } from '../../enums/audit-log.enum';
import { AUDIT_META_KEY, AuditMeta } from '../../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest<Request>();

    const meta = this.reflector.get<AuditMeta>(
      AUDIT_META_KEY,
      context.getHandler(),
    );

    if (!meta) return next.handle();

    if (req.method === 'GET') return next.handle();

    return next.handle().pipe(
      tap(() => {
        const payload = req.auditPayload;

        const actorId = req?.user?.id;
        if (!actorId) return;

        const targetId = payload?.targetId;
        if (!targetId) return;

        const ipRaw = req.ip;
        const ipAddress =
          typeof ipRaw === 'string' && ipRaw.startsWith('::ffff:')
            ? ipRaw.replace('::ffff:', '')
            : (ipRaw ?? null);

        const userAgent =
          typeof req.headers['user-agent'] === 'string'
            ? req.headers['user-agent'].slice(0, 255)
            : null;

        void this.auditService.create({
          actorId,
          action: meta.action as AuditLogAction,
          targetType: meta.targetType,
          targetId,
          oldValue: payload?.oldValue ?? undefined,
          newValue: payload?.newValue ?? undefined,
          description: payload?.description ?? undefined,
          ip: ipAddress ?? undefined,
          userAgent: userAgent ?? undefined,
        });
      }),
    );
  }
}
