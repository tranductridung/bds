import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from 'src/authorization/entities/permission.entity';

@Injectable()
export class PermissionSeed {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async seed() {
    const resourceActions: Record<string, string[]> = {
      default: ['create', 'read', 'update', 'delete'],

      dashboard: ['read'],
      report: ['read'],
      revenue: ['read'],

      order: ['cancel', 'export'],
      purchase: ['cancel', 'import'],
      consignment: ['cancel', 'import', 'export'],
      item: ['cancel', 'import', 'export', 'transfer'],
    };

    const resources = [
      'authorization',
      'appointment',
      'consignment',
      'course',
      'dashboard',
      'discount',
      'enrollment',
      'inventory',
      'item',
      'modules',
      'order',
      'partner',
      'payment',
      'product',
      'purchase',
      'report',
      'revenue',
      'room',
      'service',
      'transaction',
      'user',
    ];

    // Get current permission in DB
    const existingPermissions = await this.permissionRepo.find({
      select: ['key'],
    });
    const existingKeys = new Set(existingPermissions.map((p) => p.key));

    const newPermissions: Permission[] = [];

    // Create permission list
    for (const resource of resources) {
      // Use Set to remove duplicate action
      const actions = new Set([
        ...(resourceActions.default || []),
        ...(resourceActions[resource] || []),
      ]);

      for (const action of actions) {
        const key = `${resource}:${action}`;
        if (!existingKeys.has(key)) {
          newPermissions.push(
            this.permissionRepo.create({
              action,
              resource,
              key,
            }),
          );
        }
      }
    }

    if (newPermissions.length > 0) {
      await this.permissionRepo.save(newPermissions);
      console.log(`✅ Seeded ${newPermissions.length} new permissions`);
    } else {
      console.log('ℹ️ No new permissions to seed');
    }
  }
}
