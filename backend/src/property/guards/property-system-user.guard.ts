import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { Property } from '../entities/property.entity';
import { UserPayload } from '@/src/authentication/interfaces/user-payload.interface';

@Injectable()
export class PropertySystemUserGuard implements CanActivate {
  constructor(private readonly dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as UserPayload;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isSystem) {
      throw new ForbiddenException();
    }

    const propertyId = Number(request.params.propertyId);

    if (!propertyId) {
      throw new BadRequestException('Property ID is required');
    }

    const propertyExist = await this.dataSource
      .getRepository(Property)
      .exists({ where: { id: propertyId } });

    if (!propertyExist) {
      throw new NotFoundException('Property not found');
    }

    return true;
  }
}
