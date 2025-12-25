import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
  ParseEnumPipe,
  Delete,
} from '@nestjs/common';
import { Request } from 'express';
import { LeadService } from './lead.service';
import { LeadStatus } from '../enums/lead.enum';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadAccessGuard } from '../guards/lead.guard';
import { LeadNoteService } from '../note/lead-note.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreateLeadNoteDto } from '../note/dto/create-lead-note.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { LeadAssignmentService } from '../assignment/lead-assignment.service';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';
import { LeadActivityService } from '../activity/lead-activity.service';
import { UpdateLeadNoteDto } from '../note/dto/update-lead-note.dto';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadNoteService: LeadNoteService,
    private readonly leadActivityService: LeadActivityService,
  ) {}

  @RequirePermissions('lead:create')
  @UseGuards(SystemUserGuard)
  @Post()
  async create(@Req() req: Request, @Body() createLeadDto: CreateLeadDto) {
    const lead = await this.leadService.create(
      Number(req?.user?.id),
      createLeadDto,
    );
    return ResponseService.format(lead);
  }

  @RequirePermissions('lead:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { leads, total } = await this.leadService.findAll(
      Number(req?.user?.id),
      paginationDto,
    );
    return ResponseService.format(leads, { total });
  }

  @RequirePermissions('lead:read')
  @UseGuards(LeadAccessGuard)
  @Get(':leadId')
  async find(@Param('leadId', ParseIntPipe) leadId: number) {
    const lead = await this.leadService.findOne(leadId);
    return ResponseService.format(lead);
  }

  @RequirePermissions('lead:update')
  @UseGuards(LeadAccessGuard)
  @Patch(':leadId')
  async update(
    @Req() req: Request,
    @Body() updateLeadDto: UpdateLeadDto,
    @Param('leadId', ParseIntPipe) leadId: number,
  ) {
    const lead = await this.leadService.update(
      Number(req?.user?.id),
      updateLeadDto,
      leadId,
    );
    return ResponseService.format(lead);
  }

  @RequirePermissions('lead:update')
  @UseGuards(LeadAccessGuard)
  @Patch(':leadId/status')
  async changeStatus(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('status', new ParseEnumPipe(LeadStatus))
    status: LeadStatus,
  ) {
    await this.leadService.changeStatus(Number(req?.user?.id), leadId, status);
    return ResponseService.format({
      message: 'Update lead status successfully!',
    });
  }

  // LEAD ASSIGNMENT
  @RequirePermissions('lead:assignment:create')
  @UseGuards(LeadAccessGuard)
  @Post(':leadId/assignments')
  async creatAssignment(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    const lead = await this.leadService.findOne(leadId);
    const assignment = await this.leadAssignmentService.create(
      Number(req?.user?.id),
      lead,
      agentId,
    );
    return ResponseService.format(assignment);
  }

  @RequirePermissions('lead:assignment:read')
  @UseGuards(LeadAccessGuard)
  @Get(':leadId/assignments')
  async findAllAssignmentsOfLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.leadService.exist(leadId);

    const { assignments, total } =
      await this.leadAssignmentService.getAssignmentsOfLead(
        leadId,
        paginationDto,
      );
    return ResponseService.format(assignments, { total });
  }

  @RequirePermissions('lead:assignment:update')
  @UseGuards(SystemUserGuard)
  @Patch(':leadId/primary-agent')
  async changePrimaryAgent(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    await this.leadService.exist(leadId);

    await this.leadAssignmentService.changePrimaryAgent(
      Number(req?.user?.id),
      leadId,
      agentId,
    );
    return ResponseService.format({
      message: 'Change primary agent successfully',
    });
  }

  @RequirePermissions('lead:assignment:delete')
  @UseGuards(SystemUserGuard)
  @Delete(':leadId/assignments/:assignmentId')
  async remove(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    await this.leadAssignmentService.remove(
      Number(req?.user?.id),
      leadId,
      assignmentId,
    );
    return ResponseService.format({
      message: 'Remove assignment successfully!',
    });
  }

  // LEAD NOTE
  @RequirePermissions('lead:note:create')
  @UseGuards(LeadAccessGuard)
  @Post(':leadId/notes')
  async creatNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() createLeadNoteDto: CreateLeadNoteDto,
  ) {
    const lead = await this.leadService.findOne(leadId);
    const note = await this.leadNoteService.create(
      Number(req?.user?.id),
      lead,
      createLeadNoteDto,
    );
    return ResponseService.format(note);
  }

  @RequirePermissions('lead:note:read')
  @UseGuards(LeadAccessGuard)
  @Get(':leadId/notes')
  async findAllNotesOfLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.leadService.exist(leadId);

    const { notes, total } = await this.leadNoteService.getNotesOfLead(
      leadId,
      paginationDto,
    );
    return ResponseService.format(notes, { total });
  }

  @RequirePermissions('lead:note:delete')
  @UseGuards(SystemUserGuard)
  @Delete(':leadId/notes/:noteId')
  async removeNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    await this.leadNoteService.remove(Number(req?.user?.id), leadId, noteId);
    return ResponseService.format({
      message: 'Remove note successfully!',
    });
  }

  @RequirePermissions('lead:note:delete')
  @UseGuards(SystemUserGuard)
  @Patch(':leadId/notes/:noteId')
  async updateNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() updateLeadNoteDto: UpdateLeadNoteDto,
  ) {
    const updatedNote = await this.leadNoteService.update(
      Number(req?.user?.id),
      leadId,
      noteId,
      updateLeadNoteDto,
    );
    return ResponseService.format(updatedNote);
  }

  // LEAD ACTIVITY
  @RequirePermissions('lead:activity:read')
  @UseGuards(LeadAccessGuard)
  @Get(':leadId/activities')
  async findAllActivitysOfLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.leadService.exist(leadId);

    const { activities, total } =
      await this.leadActivityService.getActivitysOfLead(leadId, paginationDto);
    return ResponseService.format(activities, { total });
  }
}
