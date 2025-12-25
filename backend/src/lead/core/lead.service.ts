import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  LeadStatus,
  LeadActivityAction,
  LeadActivityResource,
} from '../enums/lead.enum';
import { Lead } from './lead.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '@/src/user/user.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { buildDiff } from '../helpers/build-diff.helper';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { LeadActivityService } from '../activity/lead-activity.service';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepo: Repository<Lead>,
    private readonly leadActivityService: LeadActivityService,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  validateBudget(budgetMin?: number, budgetMax?: number): void {
    if (budgetMin && budgetMax) {
      if (budgetMax <= budgetMin) {
        throw new BadRequestException(
          'Max budget must be greater than min budget',
        );
      }
    }
  }

  async create(
    currentUserId: number,
    createLeadDto: CreateLeadDto,
  ): Promise<Lead> {
    return this.dataSource.transaction(async (manager) => {
      const existedEmail = await manager.exists(Lead, {
        where: { email: createLeadDto.email },
      });

      if (existedEmail) {
        throw new ConflictException('Lead with this email already exists');
      }

      this.validateBudget(createLeadDto.budgetMin, createLeadDto.budgetMax);

      const lead = manager.create(Lead, createLeadDto);
      await manager.save(lead);

      await this.leadActivityService.create(
        lead.id,
        {
          action: LeadActivityAction.CREATE,
          resource: LeadActivityResource.LEAD,
          newValue: {
            email: lead.email,
            fullName: lead.fullName,
            status: lead.status,
          },
          resourceId: lead.id,
          description: 'Create new lead',
          performedById: currentUserId,
        },
        manager,
      );

      return lead;
    });
  }

  async findAll(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ leads: Lead[]; total: number }> {
    const isSystemUser = await this.userService.isSystemUser(userId);

    const queryBuilder = this.leadRepo
      .createQueryBuilder('lead')
      .addSelect(['lead.createdAt'])
      .orderBy('lead.createdAt', 'DESC');

    if (!isSystemUser) {
      queryBuilder
        .innerJoin('lead.leadAssignments', 'la', 'la.agentId = :userId', {
          userId,
        })
        .where('la.agentId = :userId', { userId });
    }

    if (
      paginationDto?.page !== undefined &&
      paginationDto?.limit !== undefined
    ) {
      const { page, limit, search } = paginationDto;

      if (search) {
        queryBuilder.andWhere('LOWER(lead.fullName) LIKE :search', {
          search: `%${search.toLowerCase()}%`,
        });
      }

      queryBuilder.skip(page * limit).take(limit);
    }
    const [leads, total] = await queryBuilder.getManyAndCount();
    return { leads, total };
  }

  async findOne(leadId: number, manager?: EntityManager): Promise<Lead> {
    const repo = manager ? manager.getRepository(Lead) : this.leadRepo;

    const lead = await repo.findOne({
      where: { id: leadId },
    });

    if (!lead) throw new NotFoundException('Lead not found!');

    return lead;
  }

  async exist(leadId: number): Promise<void> {
    const lead = await this.leadRepo.exists({
      where: { id: leadId },
    });

    if (!lead) throw new NotFoundException('Lead not found!');
  }

  async update(
    currentUserId: number,
    updateLeadDto: UpdateLeadDto,
    leadId: number,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const lead = await this.findOne(leadId, manager);
      const oldLead = structuredClone(lead);

      manager.merge(Lead, lead, updateLeadDto);

      this.validateBudget(lead.budgetMin, lead.budgetMax);

      await manager.save(lead);

      const { oldValue, newValue } = buildDiff(oldLead, lead);
      await this.leadActivityService.create(
        lead.id,
        {
          action: LeadActivityAction.UPDATE,
          resource: LeadActivityResource.LEAD,
          oldValue,
          newValue,
          resourceId: lead.id,
          description: `Update lead #${lead.id}`,
          performedById: currentUserId,
        },
        manager,
      );

      return lead;
    });
  }

  async changeStatus(
    currentUserId: number,
    leadId: number,
    newStatus: LeadStatus,
  ): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      const lead = await this.findOne(leadId, manager);

      if (lead.status === newStatus) {
        throw new BadRequestException(
          `Lead is already ${newStatus.toLowerCase()}`,
        );
      }

      await this.leadActivityService.create(
        lead.id,
        {
          action: LeadActivityAction.UPDATE,
          resource: LeadActivityResource.LEAD,
          oldValue: { status: lead.status },
          newValue: { status: newStatus },
          resourceId: lead.id,
          description: `Change status lead #${lead.id}`,
          performedById: currentUserId,
        },
        manager,
      );

      lead.status = newStatus;
      await manager.save(Lead, lead);
    });
  }
}
