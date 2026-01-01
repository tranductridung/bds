import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '@/src/user/entities/user.entity';
import { UserStatus } from '@/src/user/enums/user.enum';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface';
import { AuthJwtPayload } from '../interfaces/auth-jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const secret = configService.get<string>('ACCESS_TOKEN');
    if (!secret)
      throw new UnauthorizedException('ACCESS_TOKEN is not defined!');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: AuthJwtPayload): Promise<UserPayload> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.userRoles', 'userRole')
      .leftJoin('userRole.role', 'role')
      .where('user.id = :id', { id: payload.sub })
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.status',
        'userRole.id',
        'role.name',
        'role.isSystem',
      ])
      .getOne();

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    const isSystem = user.userRoles.some((ur) => ur.role.isSystem);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.userRoles.map((ur) => ur.role.name),
      isSystem,
    };
  }
}
