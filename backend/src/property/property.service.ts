import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  PropertyBusinessStatus,
  PropertySystemStatus,
} from './enums/property.enum';
import { DataSource, Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { buildDiff } from '../common/helpers/build-diff.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PropertyEvents } from './events/property.event';
import { PropertyAgent } from './entities/property-agents.entity';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property)
    private readonly propertyRepo: Repository<Property>,
    private readonly userService: UserService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}
  async create(createPropertyDto: CreatePropertyDto): Promise<Property> {
    if (
      (createPropertyDto.latitude && !createPropertyDto.longitude) ||
      (!createPropertyDto.latitude && createPropertyDto.longitude)
    ) {
      throw new BadRequestException(
        'Latitude and longitude must be provided together',
      );
    }

    const property = this.propertyRepo.create(createPropertyDto);
    await this.propertyRepo.save(property);
    return property;
  }

  async findAll(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ properties: Property[]; total: number }> {
    const isSystemUser = await this.userService.isSystemUser(userId);

    const queryBuilder = this.propertyRepo
      .createQueryBuilder('property')
      .addSelect(['property.createdAt'])
      .orderBy('property.createdAt', 'DESC');

    if (!isSystemUser) {
      queryBuilder
        .innerJoin('property.propertiesAgents', 'pa', 'pa.agentId = :userId', {
          userId,
        })
        .where('pa.agentId = :userId', { userId });
    }

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.andWhere('LOWER(property.name) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      queryBuilder.skip(page * limit).take(limit);
    }
    const [properties, total] = await queryBuilder.getManyAndCount();
    return { properties, total };
  }

  async findOne(propertyId: number): Promise<Property> {
    const property = await this.propertyRepo.findOne({
      where: { id: propertyId },
    });

    if (!property) throw new NotFoundException('Property not found!');

    return property;
  }

  async exist(propertyId: number): Promise<void> {
    const property = await this.propertyRepo.exists({
      where: { id: propertyId },
    });

    if (!property) throw new NotFoundException('Property not found!');
  }

  async update(updatePropertyDto: UpdatePropertyDto, propertyId: number) {
    const property = await this.findOne(propertyId);
    const oldProperty = structuredClone(property);

    this.propertyRepo.merge(property, updatePropertyDto);

    // Validate invariant trên state cuối
    const hasLat = property.latitude !== undefined;
    const hasLng = property.longitude !== undefined;

    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'Latitude and longitude must be provided together',
      );
    }

    await this.propertyRepo.save(property);

    const { oldValue, newValue } = buildDiff(oldProperty, property);

    return { oldValue, newValue, property };
  }

  async changeSystemStatus(
    currentUserId: number,
    propertyId: number,
    newStatus: PropertySystemStatus,
  ) {
    const property = await this.findOne(propertyId);
    const oldValue = { status: property.systemStatus };

    if (property.systemStatus === newStatus) {
      throw new BadRequestException(
        `Property is already ${newStatus.toLowerCase()}`,
      );
    }

    if (!this.isValidSystemStatusTransition(property.systemStatus, newStatus)) {
      throw new BadRequestException(
        `Cannot change property status from ${property.systemStatus} to ${newStatus}`,
      );
    }

    property.systemStatus = newStatus;
    await this.propertyRepo.save(property);

    const receiverIds = await this.getAgentIdsList(propertyId);
    this.eventEmitter.emit(PropertyEvents.SYSTEM_STATUS_CHANGED, {
      propertyId: propertyId,
      receiverIds,
      actorId: currentUserId,
      oldValue,
      newValue: { status: newStatus },
    });

    return { oldValue, newValue: { status: newStatus } };
  }

  async getAgentIdsList(propertyId: number) {
    const rows = await this.dataSource
      .createQueryBuilder(PropertyAgent, 'pa')
      .select('pa.agentId', 'agentId')
      .where('pa.propertyId = :propertyId', { propertyId })
      .getRawMany<{ agentId: number }>();

    const receiverIds = rows.map((r) => r.agentId);
    return receiverIds;
  }

  async changeBusinessStatus(
    currentUserId: number,
    propertyId: number,
    newStatus: PropertyBusinessStatus,
  ) {
    const property = await this.findOne(propertyId);

    const oldValue = { status: property.businessStatus };

    if (property.businessStatus === newStatus) {
      throw new BadRequestException(
        `Property is already ${newStatus.toLowerCase()}`,
      );
    }

    property.businessStatus = newStatus;
    await this.propertyRepo.save(property);

    const receiverIds = await this.getAgentIdsList(propertyId);
    this.eventEmitter.emit(PropertyEvents.BUSINESS_STATUS_CHANGED, {
      propertyId: propertyId,
      receiverIds,
      actorId: currentUserId,
      oldValue,
      newValue: { status: newStatus },
    });

    return { oldValue, newValue: { status: newStatus } };
  }

  isValidSystemStatusTransition(
    currentStatus: PropertySystemStatus,
    newStatus: PropertySystemStatus,
  ): boolean {
    const allowedTransitions: Record<
      PropertySystemStatus,
      PropertySystemStatus[]
    > = {
      [PropertySystemStatus.DRAFT]: [
        PropertySystemStatus.PUBLISHED,
        PropertySystemStatus.ARCHIVED,
      ],
      [PropertySystemStatus.PUBLISHED]: [PropertySystemStatus.ARCHIVED],
      [PropertySystemStatus.ARCHIVED]: [PropertySystemStatus.DRAFT],
    };

    return allowedTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
