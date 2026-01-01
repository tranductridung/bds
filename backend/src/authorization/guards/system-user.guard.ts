import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '@/src/user/entities/user.entity';
import { UserStatus } from '@/src/user/enums/user.enum';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';

@Injectable()
export class SystemUserGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const currentUser = request.user as UserPayload;

    if (!currentUser) throw new UnauthorizedException();

    const user = await this.dataSource
      .createQueryBuilder(User, 'user')
      .leftJoinAndSelect('user.userRoles', 'ur')
      .leftJoinAndSelect('ur.role', 'role')
      .where('user.id = :id', { id: currentUser.id })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found!');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User is not active!');
    }

    const isSystemUser = user.userRoles.some((ur) => ur.role.isSystem);
    
    console.log()

    if (!isSystemUser)
      throw new ForbiddenException('Only system user can access this resource');
    return true;
  }
}
