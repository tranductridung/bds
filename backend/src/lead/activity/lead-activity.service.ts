import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LeadActivity } from './lead-activity.entity';
import { LeadActivityAction } from '../enums/lead.enum';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { CreateLeadActivityDto } from './dto/create-lead-activity.dto';

@Injectable()
export class LeadActivityService {
  constructor(
    @InjectRepository(LeadActivity)
    private readonly leadActivityRepo: Repository<LeadActivity>,
  ) {}

  async create(
    leadId: number,
    createLeadActivityDto: CreateLeadActivityDto,
    manager: EntityManager,
  ): Promise<LeadActivity> {
    if (
      createLeadActivityDto.action === LeadActivityAction.CREATE &&
      !createLeadActivityDto.newValue
    ) {
      throw new BadRequestException('newValue is required for CREATE');
    }
    if (
      createLeadActivityDto.action === LeadActivityAction.DELETE &&
      !createLeadActivityDto.oldValue
    ) {
      throw new BadRequestException('oldValue is required for DELETE');
    }
    if (
      createLeadActivityDto.action === LeadActivityAction.UPDATE &&
      (!createLeadActivityDto.oldValue || !createLeadActivityDto.newValue)
    ) {
      throw new BadRequestException(
        'oldValue & newValue are required for UPDATE',
      );
    }

    const activity = manager.create(LeadActivity, {
      ...createLeadActivityDto,
      lead: { id: leadId },
      performedBy: { id: createLeadActivityDto.performedById },
    });

    return manager.save(activity);
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ activities: LeadActivity[]; total: number }> {
    const queryBuilder = this.leadActivityRepo
      .createQueryBuilder('pr')
      .addSelect(['pr.createdAt'])
      .orderBy('pr.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }

    const [activities, total] = await queryBuilder.getManyAndCount();

    return { activities, total };
  }

  async findOne(id: number): Promise<LeadActivity> {
    const activity = await this.leadActivityRepo.findOne({
      where: { id },
      relations: ['lead', 'performedBy'],
    });

    if (!activity) throw new NotFoundException('Activity not found');

    return activity;
  }

  // LEAD ASSIGNMENTS
  async getActivitysOfLead(
    leadId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ activities: LeadActivity[]; total: number }> {
    const queryBuilder = this.leadActivityRepo
      .createQueryBuilder('pf')
      .innerJoin('pf.lead', 'lead')
      .addSelect(['pf.createdAt'])
      .where('lead.id = :leadId', { leadId })
      .orderBy('pf.createdAt', 'DESC');

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit } = paginationDto;

      queryBuilder.skip(page * limit).take(limit);
    }
    const [activities, total] = await queryBuilder.getManyAndCount();

    return { activities, total };
  }
}
