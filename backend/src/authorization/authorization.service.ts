import {
  Inject,
  forwardRef,
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from './entities/role.entity';
import { UserStatus } from '../common/enums/enum';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { UserRole } from './entities/user-role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { Permission } from './entities/permission.entity';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { RolePermission } from './entities/role-permission.entity';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

@Injectable()
export class AuthorizationService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RolePermission)
    private readonly rolePermisisonRepo: Repository<RolePermission>,
    private dataSource: DataSource,
  ) {}

  private async assertSuperadmin(userId: number) {
    const roles = await this.getUserRoles(userId);
    const isSuperadmin = roles.roles.some(
      (r) => r.name.toLowerCase() === 'superadmin',
    );
    if (!isSuperadmin) {
      throw new ForbiddenException('Only superadmin can perform this action!');
    }
  }

  // -------------------------------- ROLES --------------------------------
  async findRole(id: number) {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new NotFoundException('Role not found!');
    return role;
  }

  async findRoleByName(name: string) {
    const role = await this.roleRepo.findOneBy({ name });
    if (!role) throw new NotFoundException('Role not found!');
    return role;
  }

  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.roleRepo.findOneBy({
      name: createRoleDto.name,
    });

    if (existingRole) throw new ConflictException(`Role existed!`);

    const role = this.roleRepo.create(createRoleDto);

    await this.roleRepo.save(role);

    return role;
  }

  async findRoles(paginationDto?: PaginationDto) {
    const queryBuilder = this.roleRepo
      .createQueryBuilder('role')
      .orderBy('role.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(role.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [roles, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      return { roles, total };
    } else {
      const roles = await queryBuilder.getMany();
      return roles;
    }
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    if (updateRoleDto.name === 'superadmin')
      throw new BadRequestException('Cannot update superadmin role!');

    const role = await this.findRole(id);

    this.roleRepo.merge(role, updateRoleDto);
    await this.roleRepo.save(role);

    return role;
  }

  async removeRole(id: number) {
    const role = await this.findRole(id);

    if (role.name === 'superadmin')
      throw new BadRequestException('Cannot delete Superadmin role!');

    await this.roleRepo.remove(role);
    return { message: 'Delete role success!' };
  }

  // -------------------------------- PERMISSIONS --------------------------------
  async getPermissions(userId: number, resource?: string) {
    await this.userService.findOne(userId);

    const qb = this.userRoleRepo
      .createQueryBuilder('userRole')
      .leftJoin('userRole.role', 'role')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .leftJoin('rolePermission.permission', 'permission')
      .where('userRole.userId = :userId', { userId });

    if (resource)
      qb.andWhere('permission.resource = :resource', {
        resource: resource.trim().toLowerCase(),
      });

    const rows = await qb
      .select('DISTINCT permission.key', 'permission_key')
      .getRawMany<{ permission_key: string }>();

    return {
      permissions: rows.map((row) => row.permission_key),
    };
  }

  async createPermission(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.permissionRepo.findOneBy({
      action: createPermissionDto.action,
      resource: createPermissionDto.resource,
    });

    if (existingPermission) throw new ConflictException(`Permission existed!`);

    const permission = this.permissionRepo.create({
      ...createPermissionDto,
      key: `${createPermissionDto.resource}:${createPermissionDto.action}`,
    });

    await this.permissionRepo.save(permission);

    const role = await this.findRoleByName('superadmin');
    const rolePermission = this.rolePermisisonRepo.create({
      role,
      permission,
    });

    await this.rolePermisisonRepo.save(rolePermission);

    return permission;
  }

  async findPermissions(paginationDto?: PaginationDto) {
    const queryBuilder = this.permissionRepo
      .createQueryBuilder('permission')
      .orderBy('permission.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.where('LOWER(permission.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      const [permissions, total] = await queryBuilder
        .skip(page * limit)
        .take(limit)
        .getManyAndCount();

      return { permissions, total };
    } else {
      const permissions = await queryBuilder.getMany();
      return permissions;
    }
  }

  async findPermission(id: number) {
    const permission = await this.permissionRepo.findOneBy({ id });
    if (!permission) throw new NotFoundException('Permission not found!');
    return permission;
  }

  async updatePermission(id: number, updatePermissionDto: UpdatePermissionDto) {
    const permission = await this.findPermission(id);

    this.permissionRepo.merge(permission, updatePermissionDto);
    await this.permissionRepo.save(permission);

    return permission;
  }

  async removePermission(id: number) {
    const permission = await this.findPermission(id);

    await this.permissionRepo.remove(permission);
    return { message: 'Delete permission success!' };
  }

  async findPermissionMeta() {
    const raw = await this.permissionRepo
      .createQueryBuilder('permission')
      .select([
        'GROUP_CONCAT(DISTINCT permission.action) AS actions',
        'GROUP_CONCAT(DISTINCT permission.resource) AS resources',
      ])
      .getRawOne<{ actions: string; resources: string }>();

    let actions: string[] = [];
    let resources: string[] = [];

    if (raw) {
      actions = raw.actions ? raw.actions.split(',') : [];
      resources = raw.resources ? raw.resources.split(',') : [];
    }

    return { actions, resources };
  }

  // -------------------------------- USER ROLES --------------------------------
  // Just use in system allow user have more role
  // async assignRoleToUser(userId: number, roleId: number) {
  //   const hasRole = await this.checkUserRoleExist(userId, roleId);
  //   if (hasRole) throw new BadRequestException(`User already has role!`);

  //   const role = await this.roleRepo.findOne({
  //     where: { id: roleId },
  //     select: { id: true },
  //   });

  //   if (!role) throw new NotFoundException('Role not found');

  //   const userRole = this.userRoleRepo.create({
  //     user: { id: userId },
  //     role: { id: role.id },
  //   });

  //   await this.userRoleRepo.save(userRole);
  //   return role.id;
  // }

  // async assignRoleToUser(
  //   userId: number,
  //   roleId: number,
  //   manager?: EntityManager,
  // ) {
  //   const roleRepo = manager ? manager.getRepository(Role) : this.roleRepo;
  //   const userRoleRepo = manager
  //     ? manager.getRepository(UserRole)
  //     : this.userRoleRepo;
  //   const userRepo = manager ? manager.getRepository(User) : this.userRepo;

  //   const user = await userRepo.findOne({ where: { id: userId } });
  //   if (!user) throw new NotFoundException('User not found!');

  //   if (user.status === UserStatus.UNVERIFIED)
  //     throw new BadRequestException(
  //       `User with status ${user.status} cannot be assigned a role yet.`,
  //     );

  //   const role = await roleRepo.findOne({
  //     where: { id: roleId },
  //     select: { id: true, name: true },
  //   });

  //   if (!role) throw new NotFoundException('Role not found');

  //   if (role.name === 'superadmin') {
  //     const count = await userRoleRepo.count({
  //       where: {
  //         role,
  //       },
  //     });

  //     if (count >= 1)
  //       throw new BadRequestException(
  //         'Cannot create more than one SuperAdmin user!',
  //       );
  //   }

  //   // Find exist userRole
  //   const existingUserRole = await userRoleRepo.findOne({
  //     where: { user: { id: userId } },
  //     relations: ['role'],
  //   });

  //   if (existingUserRole) {
  //     // Update role
  //     existingUserRole.role = role;
  //     await userRoleRepo.save(existingUserRole);
  //   } else {
  //     // Create role
  //     const newUserRole = userRoleRepo.create({
  //       user: { id: userId },
  //       role: { id: role.id },
  //     });

  //     await userRoleRepo.save(newUserRole);
  //   }

  //   return { userId, roleId: role.id };
  // }

  // Check lại, chỉ superadmin mới có quyền
  async removeUserRole(currentUserId: number, userId: number, roleId: number) {
    if (currentUserId === userId)
      throw new BadRequestException('You cannot remove your role');

    const role = await this.roleRepo.findOne({
      where: { id: roleId },
      select: { id: true },
    });

    if (!role) throw new NotFoundException('Role not found!');

    await this.userRoleRepo.delete({
      user: { id: userId },
      role: { id: role.id },
    });

    // const countUserRole = await this.userRoleRepo.count({
    //   where: { user: { id: userId } },
    // });

    // if (countUserRole === 0)
    //   await this.userService.changeStatus(userId, UserStatus.PENDING);

    return { message: 'Delete user role success!' };
  }

  async checkUserRoleExist(userId: number, roleId: number) {
    return await this.userRoleRepo.exists({
      where: {
        user: { id: userId },
        role: { id: roleId },
      },
    });
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    const hasRole = await this.checkUserRoleExist(userId, roleId);
    if (!hasRole) throw new BadRequestException(`User does not have role!`);

    const role = await this.findRole(roleId);

    await this.userRoleRepo.delete({
      user: { id: userId },
      role,
    });

    return { message: `Removed role success!` };
  }

  async getUserRoles(userId: number) {
    await this.userService.findOne(userId);

    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: userId } },
      relations: ['role'],
    });

    return { roles: userRoles.map((ur) => ur.role) };
  }

  // -------------------------------- ROLE PERMISSIONS --------------------------------
  async getRolePermissions(roleId: number) {
    // Check role exist
    await this.findRole(roleId);
    const rolePermissions = await this.rolePermisisonRepo.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    return {
      permissions: rolePermissions.map((rp) => rp.permission),
    };
  }

  async updatePermissionsToRole(roleId: number, permissionIds: number[]) {
    return await this.dataSource.transaction(async (manager) => {
      // Check exist role
      const role = await manager
        .getRepository(Role)
        .findOne({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');

      if (role.name.toLowerCase() === 'superadmin')
        throw new BadRequestException('Cannot change Superadmin role!');

      // Remove all existed rolePermissions
      await manager
        .getRepository(RolePermission)
        .delete({ role: { id: roleId } });

      // Insert new permission for role
      if (permissionIds.length > 0) {
        const permissions = await manager.getRepository(Permission).findBy({
          id: In(permissionIds),
        });

        const rolePermissions = permissions.map((permission) =>
          manager.getRepository(RolePermission).create({
            role,
            permission,
          }),
        );

        await manager.getRepository(RolePermission).save(rolePermissions);
      }

      return {
        roleId: role.id,
        permissionIds,
      };
    });
  }

  async assignPermissionsToRole(roleId: number, permissionId: number) {
    // Check role exist
    const role = await this.findRole(roleId);

    const rolePermissions = this.rolePermisisonRepo.create({
      role,
      permission: { id: permissionId },
    });

    await this.rolePermisisonRepo.save(rolePermissions);
    return { roleId: role.id };
  }

  async removePermissionsFromRole(roleId: number, permissionId: number) {
    // Check role exist
    await this.findRole(roleId);
    await this.rolePermisisonRepo.delete({
      role: { id: roleId },
      permission: { id: permissionId },
    });
    return { message: 'Remove permissions from role success!' };
  }

  async getPermissionsOfRole(roleId: number) {
    // Check role exist
    await this.findRole(roleId);
    const rolePermissions = await this.rolePermisisonRepo.find({
      where: { role: { id: roleId } },
      relations: ['permission'],
    });
    return {
      permissions: rolePermissions.map((rp) => rp.permission),
    };
  }

  // -------------------------------- USER PERMISSIONS --------------------------------
  async checkPermissions(userId: number, permissions: string[]) {
    const count = await this.userRoleRepo
      .createQueryBuilder('userRole')
      .leftJoin('userRole.role', 'role')
      .leftJoin('role.rolePermissions', 'rolePermission')
      .leftJoin('rolePermission.permission', 'permission')
      .where('userRole.userId = :userId', { userId })
      .andWhere('permission.key IN (:...permissions)', { permissions })
      .getCount();

    //  User must have all permissions
    return count === permissions.length;
  }

  async getUserPermissions(userId: number) {
    const userRoles = await this.userRoleRepo.find({
      where: { user: { id: userId } },
      relations: [
        'role',
        'role.rolePermissions',
        'role.rolePermissions.permission',
      ],
    });

    if (!userRoles || userRoles.length === 0) return [];

    const permissions = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.key),
    );

    return Array.from(new Set(permissions));
  }

  async assignRoleToUser(
    userId: number,
    roleId: number,
    manager?: EntityManager,
  ) {
    const roleRepo = manager ? manager.getRepository(Role) : this.roleRepo;
    const userRoleRepo = manager
      ? manager.getRepository(UserRole)
      : this.userRoleRepo;
    const userRepo = manager ? manager.getRepository(User) : this.userRepo;

    const user = await userRepo.exists({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const role = await roleRepo.findOne({
      where: { id: roleId },
      select: { id: true, name: true },
    });

    if (!role) throw new NotFoundException('Role not found');

    if (role.name === 'superadmin') {
      throw new BadRequestException(
        'SuperAdmin role cannot be assigned via this function',
      );
    }

    // CHECK ROLE DUPLICATE
    const existed = await userRoleRepo.findOne({
      where: {
        user: { id: userId },
        role: { id: role.id },
      },
    });

    if (existed) {
      return {
        userId,
        roleId: role.id,
        message: 'User already has this role',
      };
    }

    const newUserRole = userRoleRepo.create({
      user: { id: userId },
      role: { id: role.id },
    });

    await userRoleRepo.save(newUserRole);

    return {
      userId,
      roleId: role.id,
      message: 'Role assigned successfully',
    };
  }
}
