import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { UserService } from '../user/user.service';
import { Level } from './enums/authorization.enum';
import { User } from '../user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserRole } from './entities/user-role.entity';
import { Permission } from './entities/permission.entity';
import { AuthorizationService } from './authorization.service';
import { AlertEvents } from '../notification/events/alert.events';
import { RolePermission } from './entities/role-permission.entity';

type Mocks = Record<string, jest.Mock>;

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let roleRepo: Mocks;
  let permissionRepo: Mocks;
  let userRoleRepo: Mocks;
  let userRepo: Mocks;
  let rolePermissionRepo: Mocks;
  let dataSource: Mocks;
  let eventEmitter: Mocks;
  let userService: Mocks;

  // mock repo.create() of TypeORM: return entity build from object
  const echo = (x: unknown) => x;

  beforeEach(async () => {
    roleRepo = {
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(echo),
      save: jest.fn(),
      merge: jest.fn((target: object, src: object) =>
        Object.assign(target, src),
      ),
      remove: jest.fn(),
    };
    permissionRepo = {
      findOneBy: jest.fn(),
      create: jest.fn(echo),
      save: jest.fn(),
      merge: jest.fn((target: object, src: object) =>
        Object.assign(target, src),
      ),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    userRoleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(echo),
      save: jest.fn(),
      delete: jest.fn(),
    };
    userRepo = { exists: jest.fn() };
    rolePermissionRepo = {
      find: jest.fn(),
      create: jest.fn(echo),
      save: jest.fn(),
      delete: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };
    eventEmitter = { emit: jest.fn() };
    userService = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: UserService, useValue: userService },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
        { provide: getRepositoryToken(Permission), useValue: permissionRepo },
        { provide: getRepositoryToken(UserRole), useValue: userRoleRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepo,
        },
        { provide: DataSource, useValue: dataSource },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(AuthorizationService);
  });

  const stubFindRole = (role: unknown) =>
    jest.spyOn(service, 'findRole').mockResolvedValue(role as never);
  const stubFindRoleFails = () =>
    jest
      .spyOn(service, 'findRole')
      .mockRejectedValue(new NotFoundException('Role not found'));
  const stubFindPermission = (permission: unknown) =>
    jest
      .spyOn(service, 'findPermission')
      .mockResolvedValue(permission as never);
  const stubFindPermissionFails = () =>
    jest
      .spyOn(service, 'findPermission')
      .mockRejectedValue(new NotFoundException('Permission not found'));

  // ===================== ROLE CRUD =====================
  describe('createRole', () => {
    it('should create and return the role when the name is free', async () => {
      const dto = { name: 'editor' };
      const created = { id: 1, ...dto };
      roleRepo.findOneBy.mockResolvedValue(null);
      roleRepo.create.mockReturnValue(created);

      const result = await service.createRole(dto);

      expect(roleRepo.findOneBy).toHaveBeenCalledWith({ name: 'editor' });
      expect(roleRepo.create).toHaveBeenCalledWith(dto);
      expect(roleRepo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('should throw Conflict when the role name already exists', async () => {
      roleRepo.findOneBy.mockResolvedValue({ id: 1, name: 'editor' });

      await expect(service.createRole({ name: 'editor' })).rejects.toThrow(
        ConflictException,
      );
      expect(roleRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should merge, save and return the updated role', async () => {
      stubFindRole({ id: 1, name: 'editor' });

      const result = await service.updateRole(1, { name: 'writer' });

      expect(roleRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 1, name: 'writer' });
    });

    it('should reject renaming a role to "superadmin"', async () => {
      stubFindRole({ id: 1, name: 'editor' });

      await expect(
        service.updateRole(1, { name: 'superadmin' }),
      ).rejects.toThrow(BadRequestException);
      expect(roleRepo.save).not.toHaveBeenCalled();
    });

    it('should propagate NotFound and not save when the role does not exist', async () => {
      stubFindRoleFails();

      await expect(service.updateRole(99, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
      expect(roleRepo.save).not.toHaveBeenCalled();
    });

    // KNOWN BUG: test này FAIL với code hiện tại. Code chỉ kiểm tra tên MỚI trong dto,
    // không kiểm tra role đang được sửa có phải superadmin hay không.
    it('should NOT allow updating the superadmin role itself', async () => {
      stubFindRole({ id: 1, name: 'superadmin' });

      await expect(service.updateRole(1, { name: 'owner' })).rejects.toThrow(
        BadRequestException,
      );
      expect(roleRepo.save).not.toHaveBeenCalled();
    });

    it.todo(
      'should throw Conflict when renaming to a name that already exists',
    );
  });

  describe('removeRole', () => {
    it('should remove a normal role', async () => {
      const role = { id: 1, name: 'editor' };
      stubFindRole(role);

      await service.removeRole(1);

      expect(roleRepo.remove).toHaveBeenCalledWith(role);
    });

    it('should reject removing the superadmin role', async () => {
      stubFindRole({ id: 1, name: 'superadmin' });

      await expect(service.removeRole(1)).rejects.toThrow(BadRequestException);
      expect(roleRepo.remove).not.toHaveBeenCalled();
    });

    it('should propagate NotFound and not remove when the role does not exist', async () => {
      stubFindRoleFails();

      await expect(service.removeRole(99)).rejects.toThrow(NotFoundException);
      expect(roleRepo.remove).not.toHaveBeenCalled();
    });
  });

  // ===================== PERMISSION CRUD =====================
  describe('createPermission', () => {
    const dto = { resource: 'post', action: 'update' };

    it('should throw Conflict when resource + action already exists', async () => {
      permissionRepo.findOneBy.mockResolvedValue({ id: 1 });

      await expect(service.createPermission(dto as never)).rejects.toThrow(
        ConflictException,
      );
      expect(permissionRepo.findOneBy).toHaveBeenCalledWith({
        action: 'update',
        resource: 'post',
      });
      expect(permissionRepo.save).not.toHaveBeenCalled();
    });

    it('should build the key as "resource:action"', async () => {
      permissionRepo.findOneBy.mockResolvedValue(null);
      jest
        .spyOn(service, 'findRoleByName')
        .mockResolvedValue({ id: 1 } as never);

      await service.createPermission(dto);

      expect(permissionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'post:update' }),
      );
    });

    it('should save the permission, then grant it to the superadmin role', async () => {
      const superadmin = { id: 1, name: 'superadmin' };
      permissionRepo.findOneBy.mockResolvedValue(null);
      const findByName = jest
        .spyOn(service, 'findRoleByName')
        .mockResolvedValue(superadmin as never);

      const result = await service.createPermission(dto);

      expect(findByName).toHaveBeenCalledWith('superadmin');
      expect(rolePermissionRepo.create).toHaveBeenCalledWith({
        role: superadmin,
        permission: result,
      });
      expect(rolePermissionRepo.save).toHaveBeenCalledTimes(1);
      expect(permissionRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
        rolePermissionRepo.save.mock.invocationCallOrder[0],
      );
    });

    it.todo(
      'should not leave the permission saved when granting it to superadmin fails (cần transaction)',
    );
  });

  describe('updatePermission', () => {
    const NON_SYSTEM_LEVEL = Object.values(Level).find(
      (v) => v !== Level.SYSTEM,
    );

    it('should throw Forbidden for a system level permission', async () => {
      stubFindPermission({ id: 1, level: Level.SYSTEM });

      await expect(service.updatePermission(1, {})).rejects.toThrow(
        ForbiddenException,
      );
      expect(permissionRepo.save).not.toHaveBeenCalled();
    });

    it('should merge, save and return a non-system permission', async () => {
      stubFindPermission({
        id: 1,
        level: NON_SYSTEM_LEVEL,
        description: 'old',
      });

      const result = await service.updatePermission(1, {
        description: 'new',
      });

      expect(permissionRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ id: 1, description: 'new' });
    });

    it('should propagate NotFound when the permission does not exist', async () => {
      stubFindPermissionFails();

      await expect(service.updatePermission(99, {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it.todo('should recompute "key" when resource or action changes');
  });

  describe('removePermission', () => {
    it('should throw Forbidden for a system permission', async () => {
      stubFindPermission({ id: 1, level: Level.SYSTEM });

      await expect(service.removePermission(1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(permissionRepo.remove).not.toHaveBeenCalled();
    });

    it('should remove a non-system permission', async () => {
      const permission = {
        id: 1,
        level: Object.values(Level).find((v) => v !== Level.SYSTEM),
      };
      stubFindPermission(permission);

      await service.removePermission(1);

      expect(permissionRepo.remove).toHaveBeenCalledWith(permission);
    });
  });

  describe('findPermissionMeta', () => {
    const mockRaw = (raw: unknown) => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(raw),
      };
      permissionRepo.createQueryBuilder.mockReturnValue(qb);
    };

    it('should split comma separated values into arrays', async () => {
      mockRaw({ actions: 'read,write', resources: 'user,post' });

      await expect(service.findPermissionMeta()).resolves.toEqual({
        actions: ['read', 'write'],
        resources: ['user', 'post'],
      });
    });

    it('should return empty arrays when there is no row', async () => {
      mockRaw(undefined);

      await expect(service.findPermissionMeta()).resolves.toEqual({
        actions: [],
        resources: [],
      });
    });

    it('should return empty arrays when the aggregated fields are null', async () => {
      mockRaw({ actions: null, resources: null });

      await expect(service.findPermissionMeta()).resolves.toEqual({
        actions: [],
        resources: [],
      });
    });
  });

  // ===================== USER <-> ROLE =====================
  describe('removeUserRole', () => {
    it('should reject removing your own role', async () => {
      await expect(service.removeUserRole(5, 5, 2)).rejects.toThrow(
        BadRequestException,
      );
      expect(roleRepo.findOne).not.toHaveBeenCalled();
      expect(userRoleRepo.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFound when the role does not exist', async () => {
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.removeUserRole(1, 2, 3)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRoleRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequest when the user does not have the role', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 3, name: 'editor' });
      userRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.removeUserRole(1, 2, 3)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRoleRepo.delete).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should delete the user-role and emit the unassigned event', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 3, name: 'editor' });
      userRoleRepo.findOne.mockResolvedValue({ id: 10 });

      await service.removeUserRole(1, 2, 3);

      expect(userRoleRepo.delete).toHaveBeenCalledWith({
        user: { id: 2 },
        role: { id: 3 },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AlertEvents.AUTHOR_ROLE_UNASSIGNED,
        {
          receiverIds: [2],
          actorId: 1,
          oldRole: 'editor',
        },
      );
    });

    it('should not emit the event when the delete fails', async () => {
      roleRepo.findOne.mockResolvedValue({ id: 3, name: 'editor' });
      userRoleRepo.findOne.mockResolvedValue({ id: 10 });
      userRoleRepo.delete.mockRejectedValue(new Error('DB down'));

      await expect(service.removeUserRole(1, 2, 3)).rejects.toThrow('DB down');
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });

  describe('getRolesOfUser', () => {
    it('should return the roles of the user', async () => {
      userService.findOne.mockResolvedValue({ id: 1 });
      userRoleRepo.find.mockResolvedValue([
        { id: 1, role: { id: 10, name: 'editor' } },
        { id: 2, role: { id: 11, name: 'moderator' } },
      ]);

      const result = await service.getRolesOfUser(1);

      expect(userService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        { id: 10, name: 'editor' },
        { id: 11, name: 'moderator' },
      ]);
    });

    it('should return [] when the user has no role', async () => {
      userService.findOne.mockResolvedValue({ id: 1 });
      userRoleRepo.find.mockResolvedValue([]);

      await expect(service.getRolesOfUser(1)).resolves.toEqual([]);
    });

    it('should propagate the error and not query roles when the user does not exist', async () => {
      userService.findOne.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(service.getRolesOfUser(99)).rejects.toThrow(
        NotFoundException,
      );
      expect(userRoleRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('assignRoleToUser', () => {
    const editor = { id: 2, name: 'editor' };

    it('should throw NotFound when the user does not exist', async () => {
      userRepo.exists.mockResolvedValue(false);

      await expect(service.assignRoleToUser(1, 2)).rejects.toThrow(
        'User not found',
      );
      expect(roleRepo.findOne).not.toHaveBeenCalled();
    });

    it('should throw NotFound when the role does not exist', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue(null);

      await expect(service.assignRoleToUser(1, 2)).rejects.toThrow(
        'Role not found',
      );
      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });

    it('should reject assigning the superadmin role', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue({ id: 1, name: 'superadmin' });

      await expect(service.assignRoleToUser(1, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });

    it('should return a message and not save/emit when the user already has the role', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue(editor);
      userRoleRepo.findOne.mockResolvedValue({ id: 10 });

      const result = await service.assignRoleToUser(1, 2);

      expect(result).toEqual({
        userId: 1,
        roleId: 2,
        message: 'User already has this role',
      });
      expect(userRoleRepo.save).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should create and save the user-role', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue(editor);
      userRoleRepo.findOne.mockResolvedValue(null);

      await service.assignRoleToUser(1, 2, 9);

      expect(userRoleRepo.create).toHaveBeenCalledWith({
        user: { id: 1 },
        role: { id: 2 },
      });
      expect(userRoleRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should emit the assigned event to the user with the actor id', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue(editor);
      userRoleRepo.findOne.mockResolvedValue(null);

      await service.assignRoleToUser(1, 2, 9);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AlertEvents.AUTHOR_ROLE_ASSIGNED,
        expect.objectContaining({ receiverIds: [1], actorId: 9 }),
      );
    });

    // KNOWN BUG: test này FAIL với code hiện tại. newUserRole.role chỉ có { id },
    // nên newUserRole.role.name là undefined. Cần dùng role.name.
    it('should emit the event with the new role name', async () => {
      userRepo.exists.mockResolvedValue(true);
      roleRepo.findOne.mockResolvedValue(editor);
      userRoleRepo.findOne.mockResolvedValue(null);

      await service.assignRoleToUser(1, 2, 9);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        AlertEvents.AUTHOR_ROLE_ASSIGNED,
        {
          receiverIds: [1],
          actorId: 9,
          newRole: 'editor',
        },
      );
    });

    it('should use the repositories of the given manager instead of the default ones', async () => {
      const txUserRepo = { exists: jest.fn().mockResolvedValue(true) };
      const txRoleRepo = { findOne: jest.fn().mockResolvedValue(editor) };
      const txUserRoleRepo = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn(echo),
        save: jest.fn(),
      };
      const repos = new Map<unknown, unknown>([
        [User, txUserRepo],
        [Role, txRoleRepo],
        [UserRole, txUserRoleRepo],
      ]);
      const manager = { getRepository: jest.fn((e: unknown) => repos.get(e)) };

      await service.assignRoleToUser(1, 2, 9, manager as never);

      expect(txUserRoleRepo.save).toHaveBeenCalledTimes(1);
      expect(userRepo.exists).not.toHaveBeenCalled();
      expect(roleRepo.findOne).not.toHaveBeenCalled();
      expect(userRoleRepo.save).not.toHaveBeenCalled();
    });
  });

  // ===================== ROLE <-> PERMISSION =====================
  describe('updatePermissionsToRole', () => {
    let txRoleRepo: Mocks;
    let txPermissionRepo: Mocks;
    let txRolePermissionRepo: Mocks;

    beforeEach(() => {
      txRoleRepo = { findOne: jest.fn() };
      txPermissionRepo = { findBy: jest.fn() };
      txRolePermissionRepo = {
        delete: jest.fn(),
        create: jest.fn(echo),
        save: jest.fn(),
      };
      const repos = new Map<unknown, unknown>([
        [Role, txRoleRepo],
        [Permission, txPermissionRepo],
        [RolePermission, txRolePermissionRepo],
      ]);
      const manager = { getRepository: jest.fn((e: unknown) => repos.get(e)) };
      dataSource.transaction.mockImplementation((cb: (m: unknown) => unknown) =>
        cb(manager),
      );
    });

    it('should throw NotFound when the role does not exist', async () => {
      txRoleRepo.findOne.mockResolvedValue(null);

      await expect(service.updatePermissionsToRole(99, [1])).rejects.toThrow(
        NotFoundException,
      );
      expect(txRolePermissionRepo.delete).not.toHaveBeenCalled();
    });

    it.each(['superadmin', 'SuperAdmin', 'SUPERADMIN'])(
      'should reject changing the superadmin role (name "%s")',
      async (name) => {
        txRoleRepo.findOne.mockResolvedValue({ id: 1, name });

        await expect(service.updatePermissionsToRole(1, [1])).rejects.toThrow(
          BadRequestException,
        );
        expect(txRolePermissionRepo.delete).not.toHaveBeenCalled();
      },
    );

    it('should replace all permissions of the role inside one transaction', async () => {
      const role = { id: 1, name: 'editor' };
      const p1 = { id: 10 };
      const p2 = { id: 11 };
      txRoleRepo.findOne.mockResolvedValue(role);
      txPermissionRepo.findBy.mockResolvedValue([p1, p2]);

      const result = await service.updatePermissionsToRole(1, [10, 11]);

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(txRolePermissionRepo.delete).toHaveBeenCalledWith({
        role: { id: 1 },
      });
      expect(txPermissionRepo.findBy).toHaveBeenCalledWith({
        id: In([10, 11]),
      });
      expect(txRolePermissionRepo.save).toHaveBeenCalledWith([
        { role, permission: p1 },
        { role, permission: p2 },
      ]);
      expect(
        txRolePermissionRepo.delete.mock.invocationCallOrder[0],
      ).toBeLessThan(txRolePermissionRepo.save.mock.invocationCallOrder[0]);
      expect(result).toEqual({ roleId: 1, permissionIds: [10, 11] });
      // không được ghi ngoài transaction
      expect(rolePermissionRepo.delete).not.toHaveBeenCalled();
      expect(rolePermissionRepo.save).not.toHaveBeenCalled();
    });

    it('should only remove everything when the new list is empty', async () => {
      txRoleRepo.findOne.mockResolvedValue({ id: 1, name: 'editor' });

      const result = await service.updatePermissionsToRole(1, []);

      expect(txRolePermissionRepo.delete).toHaveBeenCalledWith({
        role: { id: 1 },
      });
      expect(txPermissionRepo.findBy).not.toHaveBeenCalled();
      expect(txRolePermissionRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual({ roleId: 1, permissionIds: [] });
    });

    it('should propagate the error when saving fails so the transaction can roll back', async () => {
      txRoleRepo.findOne.mockResolvedValue({ id: 1, name: 'editor' });
      txPermissionRepo.findBy.mockResolvedValue([{ id: 10 }]);
      txRolePermissionRepo.save.mockRejectedValue(new Error('DB down'));

      await expect(service.updatePermissionsToRole(1, [10])).rejects.toThrow(
        'DB down',
      );
    });

    it.todo(
      'should decide what happens with permission ids that do not exist (hiện tại bị bỏ qua im lặng và vẫn trả về permissionIds đầu vào)',
    );
  });

  describe('assignPermissionsToRole', () => {
    it('should create and save the role-permission', async () => {
      const role = { id: 1 };
      const permission = { id: 10 };
      stubFindRole(role);
      stubFindPermission(permission);

      const result = await service.assignPermissionsToRole(1, 10);

      expect(rolePermissionRepo.create).toHaveBeenCalledWith({
        role,
        permission,
      });
      expect(rolePermissionRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ role, permission });
    });

    it('should not save when the role does not exist', async () => {
      stubFindRoleFails();
      stubFindPermission({ id: 10 });

      await expect(service.assignPermissionsToRole(99, 10)).rejects.toThrow(
        NotFoundException,
      );
      expect(rolePermissionRepo.save).not.toHaveBeenCalled();
    });

    it('should not save when the permission does not exist', async () => {
      stubFindRole({ id: 1 });
      stubFindPermissionFails();

      await expect(service.assignPermissionsToRole(1, 99)).rejects.toThrow(
        NotFoundException,
      );
      expect(rolePermissionRepo.save).not.toHaveBeenCalled();
    });

    it.todo(
      'should not create a duplicate when the role already has the permission',
    );
  });

  describe('removePermissionsFromRole', () => {
    it('should delete the matching role-permission', async () => {
      stubFindRole({ id: 1 });

      await service.removePermissionsFromRole(1, 10);

      expect(rolePermissionRepo.delete).toHaveBeenCalledWith({
        role: { id: 1 },
        permission: { id: 10 },
      });
    });

    it('should not delete when the role does not exist', async () => {
      stubFindRoleFails();

      await expect(service.removePermissionsFromRole(99, 10)).rejects.toThrow(
        NotFoundException,
      );
      expect(rolePermissionRepo.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPermissionsOfRole', () => {
    it('should return the permissions of the role', async () => {
      stubFindRole({ id: 1 });
      rolePermissionRepo.find.mockResolvedValue([
        { id: 1, permission: { id: 10, key: 'post:read' } },
        { id: 2, permission: { id: 11, key: 'post:write' } },
      ]);

      const result = await service.getPermissionsOfRole(1);

      expect(rolePermissionRepo.find).toHaveBeenCalledWith({
        where: { role: { id: 1 } },
        relations: { permission: true },
      });
      expect(result).toEqual([
        { id: 10, key: 'post:read' },
        { id: 11, key: 'post:write' },
      ]);
    });

    it('should return [] when the role has no permission', async () => {
      stubFindRole({ id: 1 });
      rolePermissionRepo.find.mockResolvedValue([]);

      await expect(service.getPermissionsOfRole(1)).resolves.toEqual([]);
    });

    it('should not query permissions when the role does not exist', async () => {
      stubFindRoleFails();

      await expect(service.getPermissionsOfRole(99)).rejects.toThrow(
        NotFoundException,
      );
      expect(rolePermissionRepo.find).not.toHaveBeenCalled();
    });
  });
});
