import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { MailService } from '../mail/mail.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { RefreshTokenModule } from '../refresh-token/refresh-token.module';
import { PermissionsGuard } from '../authorization/guards/permission.guard';
import { AuthorizationModule } from 'src/authorization/authorization.module';
import { SetupPasswordJwtStrategy } from './strategies/setup-password-jwt.strategy';

@Module({
  imports: [
    JwtModule.register({}),
    RefreshTokenModule,
    AuthorizationModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    MailService,
    PermissionsGuard,
    RefreshJwtStrategy,
    AuthenticationService,
    SetupPasswordJwtStrategy,
  ],
  exports: [AuthenticationService, PermissionsGuard],
})
export class AuthenticationModule {}
