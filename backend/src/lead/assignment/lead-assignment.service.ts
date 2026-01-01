import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from '@/src/user/user.service';
import { LeadAssignment } from './lead-assignment.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { LeadActivityService } from '../activity/lead-activity.service';
import { LeadActivityAction, LeadActivityResource } from '../enums/lead.enum';

@Injectable()
export class LeadAssignmentService {
  constructor(
    @InjectRepository(LeadAssignment)
    private readonly leadAssignmentRepo: Repository<LeadAssignment>,
    private readonly leadActivityService: LeadActivityService,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
  ) {}

  async changePrimaryAgent(
    currentUserId: number,
    leadId: number,
    agentId: number,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const assignment = await manager.findOne(LeadAssignment, {
        where: {
          lead: { id: leadId },
          agent: { id: agentId },
        },
      });

      if (!assignment)
        throw new NotFoundException('Agent is not assigned to this lead');

      if (assignment.isPrimary)
        throw new BadRequestException('Already primary');

      const oldPrimaryAssignment = await manager.findOne(LeadAssignment, {
        where: {
          lead: { id: leadId },
          isPrimary: true,
        },
        relations: ['agent'],
      });

      await manager.update(
        LeadAssignment,
        { lead: { id: leadId } },
        { isPrimary: false },
      );

      await manager.update(
        LeadAssignment,
        { id: assignment.id },
        { isPrimary: true },
      );

      const oldValue = {
        primaryAgentId: oldPrimaryAssignment?.agent.id,
      };
      const newValue = { primaryAgentId: agentId };

      await this.leadActivityService.create(
        leadId,
        {
          action: LeadActivityAction.UPDATE,
          resource: LeadActivityResource.ASSIGNMENT,
          resourceId: assignment.id,
          oldValue,
          newValue,
          description: `Change primary agent to user #${agentId}`,
          performedById: currentUserId,
        },
        manager,
      );

      return { oldValue, newValue };
    });
  }

  async create(currentUserId: number, leadId: number, agentId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const agent = await this.userService.findOne(agentId, true);

      const repo = manager.getRepository(LeadAssignment);

      // Check if agent is exist in lead
      const leadAgentExist = await repo.findOne({
        where: {
          lead: { id: leadId },
          agent: { id: agentId },
        },
      });

      if (leadAgentExist)
        throw new BadRequestException(
          'Assignment with this agent was added to this lead',
        );

      const isPrimaryAgentExist = await repo.exists({
        where: {
          lead: { id: leadId },
          isPrimary: true,
        },
      });

      const assignment = repo.create({
        isPrimary: !isPrimaryAgentExist,
        agent,
        lead: { id: leadId },
      });

      await repo.save(assignment);

      const newValue = {
        agentId: assignment.agent.id,
        isPrimary: assignment.isPrimary,
      };

      await this.leadActivityService.create(
        leadId,
        {
          action: LeadActivityAction.CREATE,
          resource: LeadActivityResource.ASSIGNMENT,
          newValue,
          resourceId: assignment.id,
          description: `Create new assignment for lead #${leadId}`,
          performedById: currentUserId,
        },
        manager,
      );

      return { assignment, newValue };
    });
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ assignments: LeadAssignment[]; total: number }> {
    const queryBuilder = this.leadAssignmentRepo
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

    const [assignments, total] = await queryBuilder.getManyAndCount();

    return { assignments, total };
  }

  async findOne(id: number, manager?: EntityManager): Promise<LeadAssignment> {
    const repo = manager
      ? manager.getRepository(LeadAssignment)
      : this.leadAssignmentRepo;

    const assignment = await repo.findOne({
      where: { id },
      relations: ['agent', 'lead'],
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    return assignment;
  }

  async findAssignmentWithLead(
    leadId: number,
    assignmentId: number,
    manager?: EntityManager,
  ): Promise<LeadAssignment> {
    const repo = manager
      ? manager.getRepository(LeadAssignment)
      : this.leadAssignmentRepo;

    const assignment = await repo.findOne({
      where: { id: assignmentId, lead: { id: leadId } },
      relations: ['agent', 'lead'],
    });

    if (!assignment) throw new NotFoundException('Assignment not found');

    return assignment;
  }

  async remove(currentUserId: number, leadId: number, assignmnetId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const assignment = await this.findAssignmentWithLead(
        leadId,
        assignmnetId,
        manager,
      );

      await manager.remove(LeadAssignment, assignment);

      const oldValue = {
        agentId: assignment.agent.id,
        isPrimary: assignment.isPrimary,
      };

      await this.leadActivityService.create(
        leadId,
        {
          action: LeadActivityAction.DELETE,
          resource: LeadActivityResource.ASSIGNMENT,
          oldValue,
          resourceId: assignmnetId,
          description: `Remove assignment of lead #${leadId}`,
          performedById: currentUserId,
        },
        manager,
      );

      return { oldValue };
    });
  }

  // LEAD ASSIGNMENTS
  async getAssignmentsOfLead(
    leadId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ assignments: LeadAssignment[]; total: number }> {
    const queryBuilder = this.leadAssignmentRepo
      .createQueryBuilder('pf')
      .innerJoin('pf.lead', 'lead')
      .innerJoinAndSelect('pf.agent', 'agent')
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
    const [assignments, total] = await queryBuilder.getManyAndCount();

    return { assignments, total };
  }
}
