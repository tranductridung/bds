import { DataSource } from 'typeorm';
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PermissionsGuard } from './guards/permission.guard';
import { UserPayload } from '../authentication/interfaces/user-payload.interface';
import { Reflector } from '@nestjs/core';
import { AuthorizationService } from './authorization.service';
import { SuperAdminGuard } from './guards/superadmin.guard';
import { SystemUserGuard } from './guards/system-user.guard';
import { UserStatus } from '../user/enums/user.enum';
import { User } from '../user/entities/user.entity';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let authorizationService: { checkPermissions: jest.Mock };

  const handler = jest.fn();
  class TestController {}

  // Helper dựng ExecutionContext giả, truyền user (hoặc undefined)
  const createContext = (user?: Partial<UserPayload>): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const buildUser = (overrides: Partial<UserPayload> = {}): UserPayload => ({
    id: 1,
    email: 'a@test.com',
    fullName: 'Test User',
    roles: ['editor'],
    isSystem: false,
    ...overrides,
  });

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    authorizationService = { checkPermissions: jest.fn() };

    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authorizationService as unknown as AuthorizationService,
    );
  });

  it('should read metadata "requirePermissions" from handler then class', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await guard.canActivate(createContext(buildUser()));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      'requirePermissions',
      [handler, TestController],
    );
  });

  describe('no user on request', () => {
    it('should deny and not call the service', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:read']);

      const result = await guard.canActivate(createContext(undefined));

      expect(result).toBe(false);
      expect(authorizationService.checkPermissions).not.toHaveBeenCalled();
    });
  });

  describe('superadmin bypass', () => {
    it('should allow superadmin without calling the service', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:delete']);
      const user = buildUser({ roles: ['superadmin'] });

      const result = await guard.canActivate(createContext(user));

      expect(result).toBe(true);
      expect(authorizationService.checkPermissions).not.toHaveBeenCalled();
    });

    it('should allow when superadmin is one of several roles', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:delete']);
      const user = buildUser({ roles: ['editor', 'superadmin'] });

      const result = await guard.canActivate(createContext(user));

      expect(result).toBe(true);
      expect(authorizationService.checkPermissions).not.toHaveBeenCalled();
    });

    it.each(['admin', 'Superadmin', 'super_admin', 'superadmin2'])(
      'should NOT bypass for similar role name "%s"',
      async (roleName) => {
        reflector.getAllAndOverride.mockReturnValue(['user:delete']);
        authorizationService.checkPermissions.mockResolvedValue(false);
        const user = buildUser({ roles: [roleName] });

        const result = await guard.canActivate(createContext(user));

        expect(result).toBe(false);
        expect(authorizationService.checkPermissions).toHaveBeenCalled();
      },
    );
  });

  describe('no permission required', () => {
    it('should allow when metadata is undefined', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(createContext(buildUser()));

      expect(result).toBe(true);
      expect(authorizationService.checkPermissions).not.toHaveBeenCalled();
    });

    it('should allow when metadata is an empty array', async () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(createContext(buildUser()));

      expect(result).toBe(true);
      expect(authorizationService.checkPermissions).not.toHaveBeenCalled();
    });
  });

  describe('permission check', () => {
    it('should call checkPermissions with user id and required permissions', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:read', 'user:update']);
      authorizationService.checkPermissions.mockResolvedValue(true);

      await guard.canActivate(createContext(buildUser({ id: 7 })));

      expect(authorizationService.checkPermissions).toHaveBeenCalledWith(7, [
        'user:read',
        'user:update',
      ]);
    });

    it('should allow when the service says the user has permission', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:read']);
      authorizationService.checkPermissions.mockResolvedValue(true);

      const result = await guard.canActivate(createContext(buildUser()));

      expect(result).toBe(true);
    });

    it('should deny when the service says the user lacks permission', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:delete']);
      authorizationService.checkPermissions.mockResolvedValue(false);

      const result = await guard.canActivate(createContext(buildUser()));

      expect(result).toBe(false);
    });

    it('should reject (fail closed) when the service throws', async () => {
      reflector.getAllAndOverride.mockReturnValue(['user:read']);
      authorizationService.checkPermissions.mockRejectedValue(
        new Error('DB down'),
      );

      await expect(
        guard.canActivate(createContext(buildUser())),
      ).rejects.toThrow('DB down');
    });
  });
});

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;
  let authorizationService: { getRolesOfUser: jest.Mock };

  const createContext = (user?: { id: number }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    authorizationService = { getRolesOfUser: jest.fn() };

    guard = new SuperAdminGuard(
      authorizationService as unknown as AuthorizationService,
    );
  });

  describe('no user on request', () => {
    it('should throw Unauthorized and not query roles', async () => {
      await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(
        UnauthorizedException,
      );
      expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
    });
  });

  describe('superadmin', () => {
    it('should query roles by user id', async () => {
      authorizationService.getRolesOfUser.mockResolvedValue([
        { name: 'superadmin' },
      ]);

      await guard.canActivate(createContext({ id: 7 }));

      expect(authorizationService.getRolesOfUser).toHaveBeenCalledWith(7);
    });

    it('should allow a user whose role is superadmin', async () => {
      authorizationService.getRolesOfUser.mockResolvedValue([
        { name: 'superadmin' },
      ]);

      const result = await guard.canActivate(createContext({ id: 1 }));

      expect(result).toBe(true);
    });

    it('should allow when superadmin is one of several roles', async () => {
      authorizationService.getRolesOfUser.mockResolvedValue([
        { name: 'editor' },
        { name: 'superadmin' },
      ]);

      const result = await guard.canActivate(createContext({ id: 1 }));

      expect(result).toBe(true);
    });

    it.each(['SuperAdmin', 'SUPERADMIN'])(
      'should match role name case-insensitively: "%s"',
      async (name) => {
        authorizationService.getRolesOfUser.mockResolvedValue([{ name }]);

        const result = await guard.canActivate(createContext({ id: 1 }));

        expect(result).toBe(true);
      },
    );
  });

  describe('not superadmin', () => {
    it('should throw Forbidden with the expected message', async () => {
      authorizationService.getRolesOfUser.mockResolvedValue([
        { name: 'editor' },
      ]);

      const promise = guard.canActivate(createContext({ id: 1 }));

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toThrow(
        'Only superadmin can access this resource',
      );
    });

    it('should throw Forbidden when user has no roles', async () => {
      authorizationService.getRolesOfUser.mockResolvedValue([]);

      await expect(guard.canActivate(createContext({ id: 1 }))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it.each(['admin', 'super_admin', 'superadmin2', 'super admin'])(
      'should NOT treat similar role name "%s" as superadmin',
      async (name) => {
        authorizationService.getRolesOfUser.mockResolvedValue([{ name }]);

        await expect(
          guard.canActivate(createContext({ id: 1 })),
        ).rejects.toThrow(ForbiddenException);
      },
    );
  });

  describe('service failure', () => {
    it('should reject (fail closed) when getRolesOfUser throws', async () => {
      authorizationService.getRolesOfUser.mockRejectedValue(
        new Error('DB down'),
      );

      await expect(guard.canActivate(createContext({ id: 1 }))).rejects.toThrow(
        'DB down',
      );
    });
  });
});

describe('SystemUserGuard', () => {
  let guard: SystemUserGuard;
  let qb: Record<string, jest.Mock>;
  let dataSource: { createQueryBuilder: jest.Mock };

  const createContext = (user?: { id: number }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  const buildDbUser = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    status: UserStatus.ACTIVE,
    userRoles: [{ id: 1, role: { name: 'system', isSystem: true } }],
    ...overrides,
  });

  beforeEach(() => {
    qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    dataSource = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    guard = new SystemUserGuard(dataSource as unknown as DataSource);
  });

  describe('no user on request', () => {
    it('should throw Unauthorized and not query the DB', async () => {
      await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(
        UnauthorizedException,
      );
      expect(dataSource.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('user lookup', () => {
    it('should query the User entity by current user id', async () => {
      qb.getOne.mockResolvedValue(buildDbUser());

      await guard.canActivate(createContext({ id: 7 }));

      expect(dataSource.createQueryBuilder).toHaveBeenCalledWith(User, 'user');
      expect(qb.where).toHaveBeenCalledWith('user.id = :id', { id: 7 });
    });

    it('should throw NotFound when user does not exist in DB', async () => {
      qb.getOne.mockResolvedValue(null);

      const promise = guard.canActivate(createContext({ id: 1 }));

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toThrow('User not found!');
    });
  });

  describe('user status', () => {
    // Tự động phủ mọi status khác ACTIVE, kể cả status thêm sau này.
    // User có role system để chứng minh status được kiểm tra trước role.
    it.each(Object.values(UserStatus).filter((s) => s !== UserStatus.ACTIVE))(
      'should throw BadRequest when user status is %s (even with a system role)',
      async (status) => {
        qb.getOne.mockResolvedValue(buildDbUser({ status }));

        const promise = guard.canActivate(createContext({ id: 1 }));

        await expect(promise).rejects.toThrow(BadRequestException);
        await expect(promise).rejects.toThrow('User is not active!');
      },
    );
  });

  describe('system role', () => {
    it('should allow an active user with a system role', async () => {
      qb.getOne.mockResolvedValue(buildDbUser());

      const result = await guard.canActivate(createContext({ id: 1 }));

      expect(result).toBe(true);
    });

    it('should allow when only one of several roles is a system role', async () => {
      qb.getOne.mockResolvedValue(
        buildDbUser({
          userRoles: [
            { id: 1, role: { name: 'editor', isSystem: false } },
            { id: 2, role: { name: 'system', isSystem: true } },
          ],
        }),
      );

      const result = await guard.canActivate(createContext({ id: 1 }));

      expect(result).toBe(true);
    });

    it('should throw Forbidden when no role is a system role', async () => {
      qb.getOne.mockResolvedValue(
        buildDbUser({
          userRoles: [{ id: 1, role: { name: 'editor', isSystem: false } }],
        }),
      );

      const promise = guard.canActivate(createContext({ id: 1 }));

      await expect(promise).rejects.toThrow(ForbiddenException);
      await expect(promise).rejects.toThrow(
        'Only system user can access this resource',
      );
    });

    it('should throw Forbidden when user has no roles', async () => {
      qb.getOne.mockResolvedValue(buildDbUser({ userRoles: [] }));

      await expect(guard.canActivate(createContext({ id: 1 }))).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('DB failure', () => {
    it('should reject (fail closed) when the query throws', async () => {
      qb.getOne.mockRejectedValue(new Error('DB down'));

      await expect(guard.canActivate(createContext({ id: 1 }))).rejects.toThrow(
        'DB down',
      );
    });
  });
});
