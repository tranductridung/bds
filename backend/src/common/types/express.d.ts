import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';
import { AuditPayload } from '@/src/log/audit-log/interfaces/audit-payload.interface';

declare module 'express' {
  interface Request {
    user?: UserPayload;
    auditPayload?: AuditPayload;
  }
}
