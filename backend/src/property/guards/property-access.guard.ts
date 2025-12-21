import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PropertyAccessService } from '../property-access.service';

@Injectable()
export class PropertyAccessGuard implements CanActivate {
  constructor(private readonly accessService: PropertyAccessService) {}

  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    if (!req?.user) throw new UnauthorizedException();

    await this.accessService.assertCanAccessProperty(
      req.user.id,
      Number(req.params.propertyId),
    );
    return true;
  }
}
