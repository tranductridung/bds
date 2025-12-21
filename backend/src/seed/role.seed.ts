import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../authorization/entities/role.entity';
import { Permission } from 'src/authorization/entities/permission.entity';
import { RolePermission } from 'src/authorization/entities/role-permission.entity';

@Injectable()
export class RoleSeed {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async seed() {
    const defaultSystemRoles = ['superadmin', 'admin', 'staff'];

    for (const roleName of defaultSystemRoles) {
      // Find or create role
      let role = await this.roleRepo.findOne({ where: { name: roleName } });
      if (!role) {
        role = await this.roleRepo.save(
          this.roleRepo.create({ name: roleName, isSystem: true }),
        );
      }

      // Get all permission
      const permissions = await this.permissionRepo.find();

      // Get existing rolePermission
      const existingRolePermissions = await this.rolePermissionRepo.find({
        where: { role: { id: role.id } },
        relations: ['permission'],
      });
      const existingPermissionIds = new Set(
        existingRolePermissions.map((rp) => rp.permission.id),
      );

      const newRolePermissions: RolePermission[] = [];

      for (const permission of permissions) {
        if (
          roleName !== 'superadmin' &&
          permission.resource === 'authorization'
        ) {
          continue; // User not superadmin dont have manage system permission
        }

        if (roleName === 'staff' && permission.resource === 'testadmin') {
          continue; // Staff user dont have testadmin permission
        }

        if (!existingPermissionIds.has(permission.id)) {
          newRolePermissions.push(
            this.rolePermissionRepo.create({ role, permission }),
          );
        }
      }

      if (newRolePermissions.length > 0) {
        await this.rolePermissionRepo.save(newRolePermissions);
        console.log(
          `Added ${newRolePermissions.length} permissions to role "${roleName}"`,
        );
      } else {
        console.log(`No new permissions for role "${roleName}"`);
      }
    }
  }
}
