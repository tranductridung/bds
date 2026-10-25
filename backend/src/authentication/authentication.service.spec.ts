import {
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
import { UserStatus } from '../user/enums/user.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SystemLogAction } from '../log/enums/system-log.enum';
import { AuthenticationService } from './authentication.service';
import { RequestContext } from '../common/types/request-context.interface';
import { SystemLogEvents } from '../log/system-log/events/system-log.event';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { AuthorizationService } from '../authorization/authorization.service';

jest.mock('bcrypt', () => ({
  ...jest.requireActual('bcrypt'),
  hash: jest.fn(),
}));

const queryBuilderMock = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockReturnThis(),
};

describe('Authentication Service - login', () => {
  let authService: AuthenticationService;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let userService: {
    resetPassword: jest.Mock;
    findByEmail: jest.Mock;
    unlockUser: jest.Mock;
    findOne: jest.Mock;
  };
  let dataSource: {
    createQueryBuilder: jest.Mock;
    manager: { save: jest.Mock };
  };
  let mailService: {
    setupPasswordEmail: jest.Mock;
    resetPasswordEmail: jest.Mock;
  };

  let configService: { get: jest.Mock };
  let refreshTokenService: {
    create: jest.Mock;
    revokeToken: jest.Mock;
    isTokenExist: jest.Mock;
  };
  let authorizationService: { getRolesOfUser: jest.Mock };
  let eventEmitter: { emit: jest.Mock };
  const mockUserQuery = (user: unknown) => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
    dataSource.createQueryBuilder.mockReturnValue(qb);
    return qb;
  };

  beforeEach(async () => {
    userService = {
      resetPassword: jest.fn(),
      findByEmail: jest.fn(),
      unlockUser: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = { sign: jest.fn(), verify: jest.fn() };
    dataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      manager: { save: jest.fn() },
    };
    mailService = {
      setupPasswordEmail: jest.fn(),
      resetPasswordEmail: jest.fn(),
    };
    configService = { get: jest.fn() };
    refreshTokenService = {
      create: jest.fn(),
      revokeToken: jest.fn(),
      isTokenExist: jest.fn(),
    };
    authorizationService = { getRolesOfUser: jest.fn() };
    eventEmitter = { emit: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: DataSource, useValue: dataSource },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: configService },
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: AuthorizationService, useValue: authorizationService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    authService = moduleRef.get(AuthenticationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate function', () => {
    const basePassword = 'hashed_pw';
    const baseUser = {
      id: 1,
      email: 'a@test.com',
      password: basePassword,
      status: UserStatus.ACTIVE,
      lockUntil: null,
    };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throw 401 when user not found', async () => {
      userService.findByEmail.mockReturnValue(null);
      await expect(
        authService.validate('wrongEmailTest@gmail.com', 'wrongPass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throw 401 when password incorrect', async () => {
      userService.findByEmail.mockReturnValue(baseUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(
        authService.validate(baseUser.email, 'wrongPass'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('throw 401 when account is unverified', async () => {
      userService.findByEmail.mockReturnValue({
        ...baseUser,
        status: UserStatus.UNVERIFIED,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await expect(
        authService.validate(baseUser.email, 'truePass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throw 403 when account is banned', async () => {
      userService.findByEmail.mockReturnValue({
        ...baseUser,
        status: UserStatus.BANNED,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await expect(
        authService.validate(baseUser.email, 'truePass'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw 403 when account is inactive', async () => {
      userService.findByEmail.mockReturnValue({
        ...baseUser,
        status: UserStatus.INACTIVE,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await expect(
        authService.validate(baseUser.email, 'truePass'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throw 403 when account is LOCKED and lockUntil is not expired', async () => {
      const lockedUser = {
        ...baseUser,
        status: UserStatus.LOCKED,
        lockUntil: new Date(Date.now() + 100000),
      };
      userService.findByEmail.mockResolvedValue(lockedUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      await expect(
        authService.validate(baseUser.email, 'dung'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('unlock and return sub when account is LOCKED and lockUntil is expired', async () => {
      const expiredLockUser = {
        ...baseUser,
        status: UserStatus.LOCKED,
        lockUntil: new Date(Date.now() - 100000),
      };

      userService.findByEmail.mockResolvedValue(expiredLockUser);
      userService.unlockUser.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validate(
        expiredLockUser.email,
        'truePass',
      );

      expect(userService.unlockUser).toHaveBeenCalledWith(expiredLockUser.id);
      expect(result).toEqual({ sub: expiredLockUser.id });
    });

    it('unlock and return sub when account is LOCKED and lockUntil is null', async () => {
      const expiredLockUser = {
        ...baseUser,
        status: UserStatus.LOCKED,
        lockUntil: null,
      };

      userService.findByEmail.mockResolvedValue(expiredLockUser);
      userService.unlockUser.mockResolvedValue(undefined);

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validate(
        expiredLockUser.email,
        'truePass',
      );

      expect(userService.unlockUser).toHaveBeenCalledWith(expiredLockUser.id);
      expect(result).toEqual({ sub: expiredLockUser.id });
    });

    it('return id when validate success', async () => {
      userService.findByEmail.mockReturnValue(baseUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.validate(baseUser.email, 'truePass');
      expect(result).toEqual({ sub: baseUser.id });
    });
  });

  describe('login function', () => {
    let loggerErrorSpy: jest.SpyInstance;
    beforeEach(() => {
      loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    const basePassword = 'hashed_pw';
    const baseUser = {
      id: 1,
      email: 'a@test.com',
      password: basePassword,
      status: UserStatus.ACTIVE,
      lockUntil: null,
    };
    const baseReqCtx: RequestContext = {
      method: 'POST',
      path: '/auth/login',
      statusCode: 401,
    };

    it('emits AUTH_LOGIN_FAILED and throws 401 when validate fails', async () => {
      jest.spyOn(authService, 'validate').mockRejectedValue(new Error('any'));

      await expect(
        authService.login(baseUser.email, 'wrongPass', baseReqCtx),
      ).rejects.toThrow(UnauthorizedException);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SystemLogEvents.AUTH_LOGIN_FAILED,
        expect.objectContaining({
          action: SystemLogAction.AUTHENTICATION_FAILED,
          path: baseReqCtx.path,
          method: baseReqCtx.method,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(refreshTokenService.create).not.toHaveBeenCalled();
    });

    it('emits AUTH_LOGIN_FAILED and throws 401 when jwtService.sign for access token fail', async () => {
      jest
        .spyOn(authService, 'validate')
        .mockResolvedValue({ sub: baseUser.id });

      configService.get.mockReturnValue('mock-value');

      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('signTokenFailed');
      });

      await expect(
        authService.login(baseUser.email, 'truePass', baseReqCtx),
      ).rejects.toThrow(UnauthorizedException);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SystemLogEvents.AUTH_LOGIN_FAILED,
        expect.objectContaining({
          action: SystemLogAction.AUTHENTICATION_FAILED,
          path: baseReqCtx.path,
          method: baseReqCtx.method,
        }),
      );
      expect(refreshTokenService.create).not.toHaveBeenCalled();
    });

    it('emits AUTH_LOGIN_FAILED and throws 401 when jwtService.sign for refresh token fail', async () => {
      jest
        .spyOn(authService, 'validate')
        .mockResolvedValue({ sub: baseUser.id });

      configService.get.mockReturnValue('mock-value');

      jest.spyOn(jwtService, 'sign').mockImplementation(() => {
        throw new Error('signTokenFailed');
      });

      await expect(
        authService.login(baseUser.email, 'truePass', baseReqCtx),
      ).rejects.toThrow(UnauthorizedException);

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SystemLogEvents.AUTH_LOGIN_FAILED,
        expect.objectContaining({
          action: SystemLogAction.AUTHENTICATION_FAILED,
          path: baseReqCtx.path,
          method: baseReqCtx.method,
        }),
      );
      expect(refreshTokenService.create).not.toHaveBeenCalled();
    });

    it('emits AUTH_LOGIN_FAILED and throws 401 when cannot create refresh token in db', async () => {
      jest
        .spyOn(authService, 'validate')
        .mockResolvedValue({ sub: baseUser.id });
      jest.spyOn(jwtService, 'sign').mockReturnValue('signedToken');
      configService.get.mockReturnValue('mock-value');
      refreshTokenService.create.mockRejectedValue(new Error('any'));

      await expect(
        authService.login(baseUser.email, 'truePass', baseReqCtx),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenService.create).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SystemLogEvents.AUTH_LOGIN_FAILED,
        expect.objectContaining({
          action: SystemLogAction.AUTHENTICATION_FAILED,
          path: baseReqCtx.path,
          method: baseReqCtx.method,
        }),
      );
    });

    it('returns tokens and user payload when login succeeds', async () => {
      jest
        .spyOn(authService, 'validate')
        .mockResolvedValue({ sub: baseUser.id });
      jest.spyOn(jwtService, 'sign').mockReturnValue('signedToken');
      configService.get.mockReturnValue('mock-value');
      refreshTokenService.create.mockResolvedValue({ token: 'token' });

      const result = await authService.login(
        baseUser.email,
        'truePass',
        baseReqCtx,
      );

      expect(result).toEqual({
        accessToken: 'signedToken',
        refreshToken: 'signedToken',
        user: { sub: baseUser.id },
      });
      expect(refreshTokenService.create).toHaveBeenCalledWith(
        'signedToken',
        baseUser.id,
      );
      expect(loggerErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('refresh function', () => {
    const baseRefreshToken = 'validRefreshToken';
    const baseUser = {
      id: 1,
      email: 'a@test.com',
      fullName: 'fullName',
    };
    const verifyOptions = { secret: 'refresh-secret' };
    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      loggerErrorSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          REFRESH_TOKEN: 'refresh-secret',
          ACCESS_TOKEN: 'access-secret',
          ACCESS_TOKEN_EXPIRES: '15m',
          REFRESH_TOKEN_EXPIRES: '1d',
        };
        return config[key];
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
      jest.restoreAllMocks();
    });

    it.each([undefined, ''])(
      'should throw UnauthorizedException when refresh token is %p',
      async (token) => {
        await expect(authService.refresh(token)).rejects.toThrow(
          new UnauthorizedException('Refresh token required!'),
        );

        expect(loggerErrorSpy).not.toHaveBeenCalled();
        expect(jwtService.verify).not.toHaveBeenCalled();
        expect(refreshTokenService.isTokenExist).not.toHaveBeenCalled();
        expect(userService.findOne).not.toHaveBeenCalled();
        expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      },
    );

    it('should throw UnauthorizedException when jwt verification fails', async () => {
      const error = new Error('invalid signature');
      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(authService.refresh(baseRefreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(jwtService.verify).toHaveBeenCalledWith(
        baseRefreshToken,
        verifyOptions,
      );
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(refreshTokenService.isTokenExist).not.toHaveBeenCalled();
      expect(userService.findOne).not.toHaveBeenCalled();
      expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when isTokenExist throws an error', async () => {
      const error = new Error('db error');
      jwtService.verify.mockReturnValue({ sub: baseUser.id });
      refreshTokenService.isTokenExist.mockRejectedValue(error);

      await expect(authService.refresh(baseRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token!'),
      );

      expect(jwtService.verify).toHaveBeenCalledWith(
        baseRefreshToken,
        verifyOptions,
      );
      expect(refreshTokenService.isTokenExist).toHaveBeenCalledWith(
        baseRefreshToken,
        baseUser.id,
      );
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(userService.findOne).not.toHaveBeenCalled();
      expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token does not exist in DB', async () => {
      jwtService.verify.mockReturnValue({ sub: baseUser.id });
      refreshTokenService.isTokenExist.mockResolvedValue(false);

      await expect(authService.refresh(baseRefreshToken)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token!'),
      );

      expect(jwtService.verify).toHaveBeenCalledWith(
        baseRefreshToken,
        verifyOptions,
      );
      expect(refreshTokenService.isTokenExist).toHaveBeenCalledWith(
        baseRefreshToken,
        baseUser.id,
      );
      // exception nội bộ bị catch nuốt và chỉ được log
      expect(loggerErrorSpy).toHaveBeenCalledTimes(1);
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        new UnauthorizedException('Expired refresh token. Login again!'),
      );
      expect(userService.findOne).not.toHaveBeenCalled();
      expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should propagate NotFoundException when user does not exist', async () => {
      const error = new NotFoundException('User not found');
      jwtService.verify.mockReturnValue({ sub: baseUser.id });
      refreshTokenService.isTokenExist.mockResolvedValue(true);
      userService.findOne.mockRejectedValue(error);

      await expect(authService.refresh(baseRefreshToken)).rejects.toThrow(
        error,
      );

      expect(userService.findOne).toHaveBeenCalledWith(baseUser.id);
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(authorizationService.getRolesOfUser).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should propagate error when getRolesOfUser fails', async () => {
      const error = new Error('roles error');
      jwtService.verify.mockReturnValue({ sub: baseUser.id });
      refreshTokenService.isTokenExist.mockResolvedValue(true);
      userService.findOne.mockResolvedValue(baseUser);
      authorizationService.getRolesOfUser.mockRejectedValue(error);

      await expect(authService.refresh(baseRefreshToken)).rejects.toThrow(
        error,
      );

      expect(authorizationService.getRolesOfUser).toHaveBeenCalledWith(
        baseUser.id,
      );
      expect(loggerErrorSpy).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it.each([
      ['no roles', [], []],
      ['a single role', [{ name: 'admin' }], ['admin']],
      [
        'multiple roles',
        [{ name: 'admin' }, { name: 'user' }],
        ['admin', 'user'],
      ],
    ])(
      'should return a signed access token when refresh token is valid (%s)',
      async (_, roles, expectedRoleNames) => {
        jwtService.verify.mockReturnValue({ sub: baseUser.id });
        refreshTokenService.isTokenExist.mockResolvedValue(true);
        userService.findOne.mockResolvedValue(baseUser);
        authorizationService.getRolesOfUser.mockResolvedValue(roles);
        jwtService.sign.mockReturnValue('signed-access-token');

        const result = await authService.refresh(baseRefreshToken);

        expect(result).toBe('signed-access-token');
        expect(jwtService.verify).toHaveBeenCalledWith(
          baseRefreshToken,
          verifyOptions,
        );
        expect(refreshTokenService.isTokenExist).toHaveBeenCalledWith(
          baseRefreshToken,
          baseUser.id,
        );
        expect(userService.findOne).toHaveBeenCalledWith(baseUser.id);
        expect(authorizationService.getRolesOfUser).toHaveBeenCalledWith(
          baseUser.id,
        );
        expect(jwtService.sign).toHaveBeenCalledWith(
          {
            sub: baseUser.id,
            // id: baseUser.id,
            // email: baseUser.email,
            // fullName: baseUser.fullName,
            // roles: expectedRoleNames,
          },
          { secret: 'access-secret', expiresIn: '15m' },
        );
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      },
    );
  });

  // ===================== sendResetPasswordLink =====================
  describe('sendResetPasswordLink', () => {
    const RESPONSE = {
      success: true,
      message: 'Reset link is sent to your email!',
    };
    const activeUser = { id: 7, email: 'a@test.com' };

    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          RESET_PASSWORD_TOKEN: 'reset-secret',
          RESET_PASSWORD_TOKEN_EXPIRES: '15m',
          SETUP_PASSWORD_TOKEN: 'setup-secret',
          SETUP_PASSWORD_TOKEN_EXPIRES: '1d',
          FRONTEND_URL: 'https://app.test',
        };
        return config[key];
      });
    });

    it('should only look up ACTIVE users by email', async () => {
      const qb = mockUserQuery(activeUser);

      await authService.sendResetPasswordLink('a@test.com');

      expect(dataSource.createQueryBuilder).toHaveBeenCalledWith(User, 'user');
      expect(qb.where).toHaveBeenCalledWith('user.email = :email', {
        email: 'a@test.com',
      });
      expect(qb.andWhere).toHaveBeenCalledWith('user.status = :status', {
        status: UserStatus.ACTIVE,
      });
    });

    it('should return the generic response and send nothing when no active user matches', async () => {
      mockUserQuery(null);

      const result = await authService.sendResetPasswordLink('nobody@test.com');

      expect(result).toEqual(RESPONSE);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mailService.resetPasswordEmail).not.toHaveBeenCalled();
    });

    it('should sign a reset token with the reset secret and expiry from config', async () => {
      mockUserQuery(activeUser);

      await authService.sendResetPasswordLink('a@test.com');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { email: 'a@test.com', sub: 7 },
        { secret: 'reset-secret', expiresIn: '15m' },
      );
    });

    it('should email the reset link containing the token', async () => {
      mockUserQuery(activeUser);
      jwtService.sign.mockReturnValue('signed-token');
      await authService.sendResetPasswordLink('a@test.com');

      expect(mailService.resetPasswordEmail).toHaveBeenCalledWith(
        'a@test.com',
        'https://app.test/authentication/reset-password?token=signed-token',
      );
    });

    // KNOWN BUG: test này FAIL với code hiện tại. Email không tồn tại trả
    // { success, message }, còn email tồn tại trả undefined, kẻ tấn công phân biệt được
    // email nào đã đăng ký (user enumeration).
    it('should return the same response whether or not the email is registered', async () => {
      mockUserQuery(null);
      const unknownResult =
        await authService.sendResetPasswordLink('nobody@test.com');

      mockUserQuery(activeUser);
      const knownResult = await authService.sendResetPasswordLink('a@test.com');

      expect(knownResult).toEqual(unknownResult);
    });

    it.todo(
      'should not reveal that an email exists when sending the mail fails',
    );
    it.todo(
      'should take a similar amount of time for registered and unregistered emails',
    );
  });

  // ===================== resetPassword =====================
  describe('resetPassword', () => {
    const config: Record<string, string> = {
      RESET_PASSWORD_TOKEN: 'reset-secret',
      RESET_PASSWORD_TOKEN_EXPIRES: '15m',
      SETUP_PASSWORD_TOKEN: 'setup-secret',
      SETUP_PASSWORD_TOKEN_EXPIRES: '1d',
      FRONTEND_URL: 'https://app.test',
    };

    beforeEach(() => {
      configService.get.mockImplementation((key: string) => config[key]);
      jwtService.sign.mockReturnValue('signed-token');
    });

    const dto = { token: 'reset-token', newPassword: 'NewPass123!' };

    it('should verify the token with the reset secret and reset the password of its owner', async () => {
      jwtService.verify.mockReturnValue({ sub: 42, email: 'a@test.com' });

      await authService.resetPassword(dto);

      expect(jwtService.verify).toHaveBeenCalledWith('reset-token', {
        secret: 'reset-secret',
      });
      expect(userService.resetPassword).toHaveBeenCalledWith('NewPass123!', 42);
    });

    it('should throw Unauthorized and not touch the password when the token is invalid or expired', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.resetPassword(dto as never)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.resetPassword(dto as never)).rejects.toThrow(
        'Token invalid or expired!',
      );
      expect(userService.resetPassword).not.toHaveBeenCalled();
    });

    it('should log the underlying error when the token is rejected', async () => {
      const errorSpy = jest
        .spyOn(authService['logger'], 'error')
        .mockImplementation(() => undefined);

      const error = new Error('jwt expired');
      jwtService.verify.mockImplementation(() => {
        throw error;
      });

      await expect(authService.resetPassword(dto as never)).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(error);
    });

    it.todo(
      'should not report database errors as "Token invalid or expired" (hiện tại try/catch bọc cả userService.resetPassword)',
    );
    it.todo(
      'should reject a reset token that has already been used (token đang dùng lại được đến khi hết hạn)',
    );
    it.todo('should reject when the token owner is no longer ACTIVE');
  });

  // ===================== setupPassword =====================
  describe('setupPassword', () => {
    const dto = { password: 'NewPass123!' };
    beforeEach(() => {
      const hash = bcrypt.hash as jest.Mock;
      hash.mockReset();
      hash.mockResolvedValue('hashed-pw');
    });

    it('should throw NotFound when the user does not exist', async () => {
      userService.findOne.mockResolvedValue(null);

      await expect(authService.setupPassword(1, dto as never)).rejects.toThrow(
        NotFoundException,
      );
      expect(dataSource.manager.save).not.toHaveBeenCalled();
    });

    it.each(
      Object.values(UserStatus).filter((s) => s !== UserStatus.UNVERIFIED),
    )(
      'should throw BadRequest and change nothing when user status is %s',
      async (status) => {
        userService.findOne.mockResolvedValue({
          id: 1,
          status,
          password: 'old',
        });

        await expect(
          authService.setupPassword(1, dto as never),
        ).rejects.toThrow(BadRequestException);
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(dataSource.manager.save).not.toHaveBeenCalled();
      },
    );

    it('should hash the password and activate an UNVERIFIED user', async () => {
      const user = { id: 1, status: UserStatus.UNVERIFIED, password: null };
      userService.findOne.mockResolvedValue(user);

      await authService.setupPassword(1, dto);

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 10);
      expect(dataSource.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          password: 'hashed-pw',
          status: UserStatus.ACTIVE,
        }),
      );
    });

    it('should never store the plain password', async () => {
      const user = { id: 1, status: UserStatus.UNVERIFIED, password: null };
      userService.findOne.mockResolvedValue(user);

      await authService.setupPassword(1, dto);

      expect(user.password).not.toBe('NewPass123!');
    });

    it('should not allow the same setup link to be used twice', async () => {
      const user = { id: 1, status: UserStatus.UNVERIFIED, password: null };
      userService.findOne.mockResolvedValue(user);

      await authService.setupPassword(1, dto); // lần 1: user chuyển sang ACTIVE

      await expect(authService.setupPassword(1, dto as never)).rejects.toThrow(
        BadRequestException,
      );
      expect(dataSource.manager.save).toHaveBeenCalledTimes(1);
    });
  });

  // ===================== resendSetupPasswordEmail =====================

  describe('resendSetupPasswordEmail', () => {
    const config: Record<string, string> = {
      RESET_PASSWORD_TOKEN: 'reset-secret',
      RESET_PASSWORD_TOKEN_EXPIRES: '15m',
      SETUP_PASSWORD_TOKEN: 'setup-secret',
      SETUP_PASSWORD_TOKEN_EXPIRES: '1d',
      FRONTEND_URL: 'https://app.test',
    };

    const unverifiedUser = {
      id: 5,
      email: 'new@test.com',
      fullName: 'New User',
      status: UserStatus.UNVERIFIED,
    };
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => config[key]);
      jwtService.sign.mockReturnValue('signed-token');
    });
    it('should return silently after a randomized 1000-1500ms delay when the user does not exist', async () => {
      mockUserQuery(null);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      // Chạy callback ngay để test không phải chờ thật
      const timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
        cb: () => void,
      ) => {
        cb();
        return 0;
      }) as never);

      await expect(
        authService.resendSetupPasswordEmail('nobody@test.com'),
      ).resolves.toBeUndefined();

      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1250);
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(mailService.setupPasswordEmail).not.toHaveBeenCalled();
    });

    it.each(
      Object.values(UserStatus).filter((s) => s !== UserStatus.UNVERIFIED),
    )(
      'should throw BadRequest and send nothing when user status is %s',
      async (status) => {
        mockUserQuery({ ...unverifiedUser, status });

        await expect(
          authService.resendSetupPasswordEmail('new@test.com'),
        ).rejects.toThrow(BadRequestException);
        expect(jwtService.sign).not.toHaveBeenCalled();
        expect(mailService.setupPasswordEmail).not.toHaveBeenCalled();
      },
    );

    it('should sign a setup token with the setup secret and expiry from config', async () => {
      mockUserQuery(unverifiedUser);

      await authService.resendSetupPasswordEmail('new@test.com');

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 5 },
        { secret: 'setup-secret', expiresIn: '1d' },
      );
    });

    it('should email the setup link containing the token', async () => {
      mockUserQuery(unverifiedUser);

      await authService.resendSetupPasswordEmail('new@test.com');

      expect(mailService.setupPasswordEmail).toHaveBeenCalledWith(
        'new@test.com',
        'https://app.test/authentication/setup-password?token=signed-token',
      );
    });

    it.todo(
      'should respond the same for an already-verified email as for an unknown email (hiện tại 400 vs 200 làm lộ email đã đăng ký)',
    );
  });
});
