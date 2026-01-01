import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { User } from 'src/user/entities/user.entity';
import { UserStatus } from '../user/enums/user.enum';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { AuthorizationService } from '../authorization/authorization.service';
import { UserPayload } from './interfaces/user-payload.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    private dataSource: DataSource,
    private jwtService: JwtService,
    private mailService: MailService,
    private userService: UserService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
    private authorizationService: AuthorizationService,
  ) {}

  async login(email: string, password: string) {
    const payload = await this.validate(email, password);

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('ACCESS_TOKEN'),
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('REFRESH_TOKEN'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES'),
    });

    await this.refreshTokenService.create(refreshToken, payload.sub);

    return { accessToken, refreshToken, user: payload };
  }

  async logout(refreshToken: string) {
    const userPayload: UserPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get('REFRESH_TOKEN'),
    });

    return await this.refreshTokenService.removeToken(
      refreshToken,
      userPayload.id,
    );
  }

  async validate(email: string, password: string) {
    const user = await this.userService.findByEmail(email, true);

    if (!user || !(await bcrypt.compare(password, user.password ?? ''))) {
      throw new UnauthorizedException('Invalid Credentials!');
    }

    switch (user.status) {
      case UserStatus.INACTIVE:
        throw new ForbiddenException(
          'Account is inactive. Please contact the administrator to activate your account!',
        );
      case UserStatus.UNVERIFIED:
        throw new UnauthorizedException(
          'Account is not verified. Please check your email to activate your account!',
        );
      case UserStatus.BANNED:
        throw new ForbiddenException('Account is banned!');
    }
    return {
      sub: user.id,
      // email: user.email,
      // fullName: user.fullName,
      // roles: user.roles,
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token required!');

    let userPayload: UserPayload;

    try {
      userPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('REFRESH_TOKEN'),
      });

      // Check if token exist
      const isTokenExist = await this.refreshTokenService.isTokenExist(
        refreshToken,
        userPayload.id,
      );
      if (!isTokenExist)
        throw new UnauthorizedException('Expired refresh token. Login again!');
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired refresh token!');
    }

    const user = await this.userService.findOne(userPayload.id);
    const roles = await this.authorizationService.getRolesOfUser(user.id);

    // Check if token is exist in database
    await this.refreshTokenService.isTokenExist(refreshToken, user.id);

    const accessToken = this.jwtService.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: roles.map((role) => role.name),
      },
      {
        secret: this.configService.get('ACCESS_TOKEN'),
        expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES'),
      },
    );

    return accessToken;
  }

  async sendResetPasswordLink(email: string) {
    const user = await this.dataSource
      .createQueryBuilder(User, 'user')
      .where('user.email = :email', { email })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .select(['user.id', 'user.email'])
      .getOne();

    if (!user)
      return {
        success: true,
        message: 'Reset link is sent to your email!',
      };

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('RESET_PASSWORD_TOKEN'),
      expiresIn: this.configService.get('RESET_PASSWORD_TOKEN_EXPIRES'),
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const resetPwdLink = `${frontendUrl}/authentication/reset-password?token=${token}`;
    await this.mailService.resetPasswordEmail(user.email, resetPwdLink);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const payload: { sub: number; email: string } =
        await this.jwtService.verify(resetPasswordDto.token, {
          secret: this.configService.get<string>('RESET_PASSWORD_TOKEN'),
        });

      await this.userService.resetPassword(
        resetPasswordDto.newPassword,
        payload.sub,
      );
    } catch (error) {
      throw new UnauthorizedException('Token invalid or expired!');
    }
  }

  async setupPassword(id: number, setupPasswordDto: SetupPasswordDto) {
    const user = await this.userService.findOne(id);
    if (!user) throw new NotFoundException('User not found!');

    if (user.status !== UserStatus.UNVERIFIED) {
      throw new BadRequestException('Account is already activated!');
    }

    user.password = await bcrypt.hash(setupPasswordDto.password, 10);

    user.status = UserStatus.ACTIVE;

    await this.dataSource.manager.save(user);
  }

  async resendSetupPasswordEmail(email: string) {
    const user = await this.dataSource
      .createQueryBuilder(User, 'user')
      .where('user.email = :email', { email })
      .getOne();

    // Return if user not exist
    if (!user) {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));
      return;
    }

    if (user.status !== UserStatus.UNVERIFIED)
      throw new BadRequestException('Your account has been verified!');

    // Create new token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: [],
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('SETUP_PASSWORD_TOKEN'),
      expiresIn: this.configService.get('SETUP_PASSWORD_TOKEN_EXPIRES'),
    });

    const setupPwdLink = `${frontendUrl}/authentication/setup-password?token=${token}`;
    await this.mailService.setupPasswordEmail(user.email, setupPwdLink);
  }
}
