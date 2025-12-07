import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...requirePermissions: string[]) =>
  SetMetadata('requirePermissions', requirePermissions);
