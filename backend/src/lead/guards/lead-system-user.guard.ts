import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { Lead } from '../core/lead.entity';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';

@Injectable()
export class LeadSystemUserGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    if (!user) throw new UnauthorizedException();

    if (!user.isSystem) throw new ForbiddenException();

    const leadId = Number(request.params.leadId);

    if (!leadId) throw new NotFoundException('Lead not found');

    const leadExist = await this.dataSource
      .getRepository(Lead)
      .exists({ where: { id: leadId } });

    if (!leadExist) throw new NotFoundException('Lead not found');

    return true;
  }
}
