import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ReminderAccessService } from '../reminder-access.service';

@Injectable()
export class ReminderAccessGuard implements CanActivate {
  constructor(private readonly reminderAccessService: ReminderAccessService) {}

  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!req?.user) throw new UnauthorizedException();

    await this.reminderAccessService.assertCanAccessReminder(
      req.user,
      Number(req.params.reminderId),
    );
    return true;
  }
}
