import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '@/src/log/enums/audit-log.enum';
import { Request } from 'express';
import { LeadNoteService } from './lead-note.service';
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorsOld } from '@/src/common/decorators/error-response.decorator';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
@ApiTags('Lead Notes')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly leadNoteService: LeadNoteService) {}

  @RequirePermissions('lead:note:read')
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'List all lead notes with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Lead notes retrieved successfully' })
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { notes, total } = await this.leadNoteService.findAll(paginationDto);
    return ResponseService.format(notes, { total });
  }
}
@ApiTags('Lead Notes Management')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, LeadAccessGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads/:leadId/notes')
export class LeadNoteController {
  constructor(private readonly leadNoteService: LeadNoteService) {}

  @RequirePermissions('lead:note:create')
  @ApiOperation({ summary: 'Create a new note for a lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiBody({ type: CreateLeadNoteDto })
  @ApiOkResponse({ description: 'Note created successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.LEAD_NOTE,
  })
  async creatNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() createLeadNoteDto: CreateLeadNoteDto,
  ) {
    const { note, newValue } = await this.leadNoteService.create(
      Number(req?.user?.id),
      leadId,
      createLeadNoteDto,
    );

    req.auditPayload = {
      targetId: note.id,
      newValue,
      description: `Create note for lead #${leadId}`,
    };

    return ResponseService.format(note);
  }

  @RequirePermissions('lead:note:read')
  @ApiOperation({ summary: 'List all notes for a lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Lead notes retrieved successfully' })
  @ApiErrorsOld(404)
  @Get()
  async findNotesOfLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { notes, total } = await this.leadNoteService.getNotesOfLead(
      leadId,
      paginationDto,
    );
    return ResponseService.format(notes, { total });
  }

  @RequirePermissions('lead:note:delete')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiParam({ name: 'noteId', description: 'Note ID', type: 'number' })
  @ApiOkResponse({ description: 'Note deleted successfully' })
  @ApiErrorsOld(404)
  @Delete(':noteId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.LEAD_NOTE,
  })
  async removeNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    const { oldValue } = await this.leadNoteService.remove(
      Number(req?.user?.id),
      leadId,
      noteId,
    );

    req.auditPayload = {
      targetId: noteId,
      oldValue,
      description: `Remove note of lead #${leadId}`,
    };

    return ResponseService.format({
      message: 'Remove note successfully!',
    });
  }

  @RequirePermissions('lead:note:delete')
  @Patch(':noteId')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.LEAD_NOTE,
  })
  async updateNote(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @Body() updateLeadNoteDto: UpdateLeadNoteDto,
  ) {
    const { oldValue, newValue, note } = await this.leadNoteService.update(
      Number(req?.user?.id),
      leadId,
      noteId,
      updateLeadNoteDto,
    );

    if (oldValue || newValue) {
      req.auditPayload = {
        targetId: noteId,
        oldValue,
        newValue,
        description: `Update note of lead #${leadId}`,
      };
    }

    return ResponseService.format(note);
  }

  @RequirePermissions('lead:note:read')
  @Get(':noteId')
  async findOne(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ) {
    const note = await this.leadNoteService.findNoteOfLead(leadId, noteId);
    return ResponseService.format(note);
  }
}
