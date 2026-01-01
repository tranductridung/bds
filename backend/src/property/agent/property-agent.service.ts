import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { PropertyAgent } from '../entities/property-agents.entity';

@Injectable()
export class PropertyAgentService {
  constructor(
    @InjectRepository(PropertyAgent)
    private readonly propertyAgentRepo: Repository<PropertyAgent>,
    private readonly userService: UserService,
  ) {}

  async addAgentToProperty(propertyId: number, agentId: number) {
    // Check if property and agent is exist
    const agent = await this.userService.findOne(agentId, true);

    // Check if agent is exist in property
    const propertyAgentExist = await this.propertyAgentRepo.findOne({
      where: {
        property: { id: propertyId },
        agent: { id: agentId },
      },
    });

    if (propertyAgentExist)
      throw new BadRequestException('Agent was added to this property');

    const propertyAgent = this.propertyAgentRepo.create({
      agent,
      property: { id: propertyId },
    });

    await this.propertyAgentRepo.save(propertyAgent);
    return propertyAgent;
  }

  async getAgentsOfProperty(propertyId: number, paginationDto?: PaginationDto) {
    const queryBuilder = this.propertyAgentRepo
      .createQueryBuilder('pf')
      .innerJoin('pf.property', 'property')
      .innerJoinAndSelect('pf.agent', 'agent')
      .addSelect(['pf.createdAt'])
      .where('property.id = :propertyId', { propertyId })
      .orderBy('pf.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }
    const [agents, total] = await queryBuilder.getManyAndCount();

    return { agents, total };
  }

  async removeAgentOfProperty(propertyId: number, agentId: number) {
    await this.userService.findOne(agentId, true);

    // Check if agent is exist in property
    const propertyAgent = await this.propertyAgentRepo.findOne({
      where: {
        property: { id: propertyId },
        agent: { id: agentId },
      },
    });

    if (!propertyAgent)
      throw new NotFoundException('Agent not belong to this property');

    await this.propertyAgentRepo.remove(propertyAgent);

    return propertyAgent;
  }
}
