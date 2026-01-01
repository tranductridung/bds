import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Property } from './entities/property.entity';
import { PropertyAgent } from './entities/property-agents.entity';
import { UserPayload } from '../authentication/interfaces/user-payload.interface';
@Injectable()
export class PropertyAccessService {
  constructor(private readonly dataSource: DataSource) {}

  async assertCanAccessProperty(user: UserPayload, propertyId: number) {
    const isPropertyExist = await this.dataSource
      .getRepository(Property)
      .exists({ where: { id: propertyId } });

    if (!isPropertyExist) throw new NotFoundException('Property not found');

    if (user.isSystem) return;

    const isAgent = await this.dataSource.getRepository(PropertyAgent).exists({
      where: {
        property: { id: propertyId },
        agent: { id: user.id },
      },
    });

    if (!isAgent) throw new ForbiddenException();
  }
}
