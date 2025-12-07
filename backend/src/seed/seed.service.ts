import { RoleSeed } from './role.seed';
import { Injectable } from '@nestjs/common';
import { PermissionSeed } from './permission.seed';
import { SuperAdminSeed } from './superadmin.seed';

@Injectable()
export class SeedService {
  constructor(
    private readonly permissionSeed: PermissionSeed,
    private readonly roleSeed: RoleSeed,
    private readonly superadminSeed: SuperAdminSeed,
  ) {}

  async seedData() {
    await this.permissionSeed.seed();
    await this.roleSeed.seed();
    await this.superadminSeed.seed();
  }
}
