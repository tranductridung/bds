import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';

@Injectable()
export class SetupPasswordJwtStrategy extends PassportStrategy(
  Strategy,
  'setup-password-jwt',
) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('SETUP_PASSWORD_TOKEN');
    if (!secret)
      throw new UnauthorizedException('SETUP_PASSWORD_TOKEN is not defined!');

    super({
      jwtFromRequest: ExtractJwt.fromUrlQueryParameter('token'),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  validate(payload: AuthJwtPayload) {
    return { id: payload.sub };
    // return payload;
  }
}
