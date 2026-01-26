import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { NotificationAccessService } from '../notification-access.service';

@Injectable()
export class NotificationOwnerGuard implements CanActivate {
  constructor(
    private readonly notificationAccessService: NotificationAccessService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!req?.user) throw new UnauthorizedException();

    await this.notificationAccessService.assertNotificationOwner(
      req.user.id,
      Number(req.params.notificationId),
    );

    return true;
  }
}
