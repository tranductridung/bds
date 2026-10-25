import { ConfigService } from '@nestjs/config';
import { UserStatus } from '../user/enums/user.enum';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { AuthJwtPayload } from './interfaces/auth-jwt-payload.interface';
import { SetupPasswordJwtStrategy } from './strategies/setup-password-jwt.strategy';

describe('Strategy', () => {
  let strategy: JwtStrategy;
  let configService: { get: jest.Mock };
  let qb: Record<string, jest.Mock>;
  let userRepo: { createQueryBuilder: jest.Mock };

  const payload = { sub: 42 };

  const buildUser = (overrides: Record<string, unknown> = {}) => ({
    id: 42,
    email: 'a@test.com',
    fullName: 'Test User',
    status: UserStatus.ACTIVE,
    userRoles: [{ id: 1, role: { name: 'editor', isSystem: false } }],
    ...overrides,
  });

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('test-secret') };

    qb = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    userRepo = { createQueryBuilder: jest.fn().mockReturnValue(qb) };

    strategy = new JwtStrategy(
      configService as unknown as ConfigService,
      userRepo as any,
    );
  });

  describe('constructor', () => {
    it('should throw when ACCESS_TOKEN is not defined', () => {
      configService.get.mockReturnValue(undefined);

      expect(
        () =>
          new JwtStrategy(
            configService as unknown as ConfigService,
            userRepo as any,
          ),
      ).toThrow('ACCESS_TOKEN is not defined!');
    });

    it('should read ACCESS_TOKEN from config', () => {
      expect(configService.get).toHaveBeenCalledWith('ACCESS_TOKEN');
    });
  });

  describe('validate', () => {
    it('should return UserPayload for an active user', async () => {
      qb.getOne.mockResolvedValue(buildUser());

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        id: 42,
        email: 'a@test.com',
        fullName: 'Test User',
        roles: ['editor'],
        isSystem: false,
      });
    });

    it('should query user by payload.sub', async () => {
      qb.getOne.mockResolvedValue(buildUser());

      await strategy.validate(payload);

      expect(userRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(qb.where).toHaveBeenCalledWith('user.id = :id', { id: 42 });
    });

    it('should throw Unauthorized when user does not exist', async () => {
      qb.getOne.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it.each(Object.values(UserStatus).filter((s) => s !== UserStatus.ACTIVE))(
      'should throw Unauthorized when user status is %s',
      async (status) => {
        qb.getOne.mockResolvedValue(buildUser({ status }));

        await expect(strategy.validate(payload)).rejects.toThrow(
          UnauthorizedException,
        );
      },
    );

    it('should map all role names when user has multiple roles', async () => {
      qb.getOne.mockResolvedValue(
        buildUser({
          userRoles: [
            { id: 1, role: { name: 'editor', isSystem: false } },
            { id: 2, role: { name: 'moderator', isSystem: false } },
          ],
        }),
      );

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual(['editor', 'moderator']);
    });

    it('should set isSystem = true when at least one role is a system role', async () => {
      qb.getOne.mockResolvedValue(
        buildUser({
          userRoles: [
            { id: 1, role: { name: 'editor', isSystem: false } },
            { id: 2, role: { name: 'super_admin', isSystem: true } },
          ],
        }),
      );

      const result = await strategy.validate(payload);

      expect(result.isSystem).toBe(true);
    });

    it('should set isSystem = false when no role is a system role', async () => {
      qb.getOne.mockResolvedValue(buildUser());

      const result = await strategy.validate(payload);

      expect(result.isSystem).toBe(false);
    });

    it('should return empty roles and isSystem = false when user has no roles', async () => {
      qb.getOne.mockResolvedValue(buildUser({ userRoles: [] }));

      const result = await strategy.validate(payload);

      expect(result.roles).toEqual([]);
      expect(result.isSystem).toBe(false);
    });

    it('should propagate the error when the repository fails (fail closed)', async () => {
      qb.getOne.mockRejectedValue(new Error('DB down'));

      await expect(strategy.validate(payload)).rejects.toThrow('DB down');
    });
  });
});

describe('RefreshJwtStrategy', () => {
  let configService: { get: jest.Mock };

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('refresh-secret') };
  });

  it('should throw when REFRESH_TOKEN is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(
      () => new RefreshJwtStrategy(configService as unknown as ConfigService),
    ).toThrow('REFRESH_TOKEN is not defined!');
  });

  it('should read REFRESH_TOKEN from config', () => {
    new RefreshJwtStrategy(configService as unknown as ConfigService);

    expect(configService.get).toHaveBeenCalledWith('REFRESH_TOKEN');
  });

  it('should return the payload as is', () => {
    const strategy = new RefreshJwtStrategy(
      configService as unknown as ConfigService,
    );

    // const payload: UserPayload = {
    //   id: 1,
    //   email: 'test@gmail.com',
    //   fullName: 'fullName',
    //   roles: ['admin'],
    //   isSystem: true,
    // };

    const payload: AuthJwtPayload = {
      sub: 1,
    };

    expect(strategy.validate(payload)).toBe(payload);
  });
});

describe('SetupPasswordJwtStrategy', () => {
  let configService: { get: jest.Mock };

  beforeEach(() => {
    configService = { get: jest.fn().mockReturnValue('setup-secret') };
  });

  it('should throw when SETUP_PASSWORD_TOKEN is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(
      () =>
        new SetupPasswordJwtStrategy(configService as unknown as ConfigService),
    ).toThrow('SETUP_PASSWORD_TOKEN is not defined!');
  });

  it('should read SETUP_PASSWORD_TOKEN from config', () => {
    new SetupPasswordJwtStrategy(configService as unknown as ConfigService);

    expect(configService.get).toHaveBeenCalledWith('SETUP_PASSWORD_TOKEN');
  });

  it('should map payload.sub to id', () => {
    const strategy = new SetupPasswordJwtStrategy(
      configService as unknown as ConfigService,
    );
    const payload: AuthJwtPayload = { sub: 1 };

    expect(strategy.validate(payload)).toEqual({ id: 1 });
  });
});
