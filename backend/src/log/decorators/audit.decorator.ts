import { SetMetadata } from '@nestjs/common';

export const AUDIT_META_KEY = 'audit_meta_key';

export type AuditMeta = {
  action: string;
  targetType: string;
};

export const AuditLog = (meta: AuditMeta) => SetMetadata(AUDIT_META_KEY, meta);
