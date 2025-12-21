import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PropertyAgent } from './entities/property-agents.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PropertyAccessService {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(PropertyAgent)
    private readonly propertyAgentRepo: Repository<PropertyAgent>,
  ) {}

  async assertCanAccessProperty(userId: number, propertyId: number) {
    const isSystem = await this.userService.isSystemUser(userId);
    if (isSystem) return;

    const isAgent = await this.propertyAgentRepo.exists({
      where: {
        property: { id: propertyId },
        agent: { id: userId },
      },
    });

    if (!isAgent)
      throw new ForbiddenException('You are not assigned to this property');
  }
}
