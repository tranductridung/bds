import { LeadNote } from './lead-note.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { buildDiff } from '../../common/helpers/build-diff.helper';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { LeadActivityService } from '../activity/lead-activity.service';
import { LeadActivityAction, LeadActivityResource } from '../enums/lead.enum';

@Injectable()
export class LeadNoteService {
  constructor(
    @InjectRepository(LeadNote)
    private readonly leadNoteRepo: Repository<LeadNote>,
    private readonly dataSource: DataSource,
    private readonly leadActivityService: LeadActivityService,
  ) {}

  async create(
    currentUserId: number,
    leadId: number,
    createLeadNoteDto: CreateLeadNoteDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const note = manager.create(LeadNote, {
        ...createLeadNoteDto,
        lead: { id: leadId },
      });

      await manager.save(LeadNote, note);

      const newValue = { content: note.content.slice(0, 50) };

      await this.leadActivityService.create(
        leadId,
        {
          action: LeadActivityAction.CREATE,
          resource: LeadActivityResource.NOTE,
          newValue,
          resourceId: note.id,
          description: `Create new note for lead #${leadId}`,
          performedById: currentUserId,
        },
        manager,
      );

      return { note, newValue };
    });
  }

  async findAll(
    paginationDto?: PaginationDto,
  ): Promise<{ notes: LeadNote[]; total: number }> {
    const queryBuilder = this.leadNoteRepo
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

    const [notes, total] = await queryBuilder.getManyAndCount();

    return { notes, total };
  }

  async findOne(id: number, manager?: EntityManager): Promise<LeadNote> {
    const repo = manager ? manager.getRepository(LeadNote) : this.leadNoteRepo;

    const note = await repo.findOne({
      where: { id },
      relations: ['lead'],
    });

    if (!note) throw new NotFoundException('Note not found');

    return note;
  }

  async findNoteWithLead(
    noteId: number,
    leadId: number,
    manager?: EntityManager,
  ): Promise<LeadNote> {
    const repo = manager ? manager.getRepository(LeadNote) : this.leadNoteRepo;

    const note = await repo.findOne({
      where: { id: noteId, lead: { id: leadId } },
    });

    if (!note) throw new NotFoundException('Note not found');

    return note;
  }

  async remove(currentUserId: number, leadId: number, noteId: number) {
    return await this.dataSource.transaction(async (manager) => {
      const note = await this.findNoteWithLead(noteId, leadId, manager);

      await manager.remove(LeadNote, note);
      const oldValue = { content: note.content.slice(0, 50) };

      await this.leadActivityService.create(
        leadId,
        {
          action: LeadActivityAction.DELETE,
          resource: LeadActivityResource.NOTE,
          oldValue,
          resourceId: noteId,
          description: `Remove note of lead #${leadId}`,
          performedById: currentUserId,
        },
        manager,
      );

      return { oldValue };
    });
  }

  async update(
    currentUserId: number,
    leadId: number,
    noteId: number,
    updateLeadNoteDto: UpdateLeadNoteDto,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const note = await this.findNoteWithLead(noteId, leadId, manager);

      const oldNote = structuredClone(note);

      manager.merge(LeadNote, note, updateLeadNoteDto);
      await manager.save(note);

      const { oldValue, newValue } = buildDiff(oldNote, note);

      if (oldValue || newValue)
        await this.leadActivityService.create(
          leadId,
          {
            action: LeadActivityAction.UPDATE,
            resource: LeadActivityResource.NOTE,
            resourceId: note.id,
            oldValue,
            newValue,
            description: 'Update lead note',
            performedById: currentUserId,
          },
          manager,
        );

      return { oldValue, newValue, note };
    });
  }

  // LEAD NOTE
  async getNotesOfLead(
    leadId: number,
    paginationDto?: PaginationDto,
  ): Promise<{ notes: LeadNote[]; total: number }> {
    const queryBuilder = this.leadNoteRepo
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
    const [notes, total] = await queryBuilder.getManyAndCount();

    return { notes, total };
  }
}
