import { UserSeed } from './seed-user';
import { RoleSeed } from './role.seed';
import { Injectable } from '@nestjs/common';
import { PermissionSeed } from './permission.seed';

@Injectable()
export class SeedService {
  constructor(
    private readonly roleSeed: RoleSeed,
    private readonly userSeed: UserSeed,
    private readonly permissionSeed: PermissionSeed,
  ) {}

  async seedData() {
    await this.permissionSeed.seed();
    await this.roleSeed.seed();
    await this.userSeed.seedSuperadmin();

    await this.userSeed.seedAdmin('admin1@gmail.com');
    await this.userSeed.seedAdmin('admin2@gmail.com');

    await this.userSeed.seedStaff('staff1@gmail.com');
    await this.userSeed.seedStaff('staff2@gmail.com');
  }
}
