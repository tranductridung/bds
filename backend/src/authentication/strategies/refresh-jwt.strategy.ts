import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(
  Strategy,
  'refresh-jwt',
) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_TOKEN');
    if (!secret)
      throw new UnauthorizedException('REFRESH_TOKEN is not defined!');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  validate(payload: AuthJwtPayload) {
    return payload;
  }
}
