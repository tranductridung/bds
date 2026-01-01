import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { LeadAccessService } from '../core/lead-access.service';

@Injectable()
export class LeadAccessGuard implements CanActivate {
  constructor(private readonly leadAccessService: LeadAccessService) {}

  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!req?.user) throw new UnauthorizedException();

    await this.leadAccessService.assertCanAccessLead(
      req.user,
      Number(req.params.leadId),
    );
    return true;
  }
}
