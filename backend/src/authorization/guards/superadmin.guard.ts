import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthorizationService } from './../authorization.service';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';

const SUPERADMIN = 'superadmin';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const user = request.user as UserPayload;

    if (!user) throw new UnauthorizedException();

    const roles = await this.authorizationService.getRolesOfUser(user.id);

    const isSuperadmin = roles.some(
      (role) => role.name.toLowerCase() === SUPERADMIN,
    );

    if (!isSuperadmin)
      throw new ForbiddenException('Only superadmin can access this resource');

    return true;
  }
}
