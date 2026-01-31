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
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly leadNoteService: LeadNoteService) {}

  @RequirePermissions('lead:note:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { notes, total } = await this.leadNoteService.findAll(paginationDto);
    return ResponseService.format(notes, { total });
  }
}

@UseGuards(AuthJwtGuard, PermissionsGuard, LeadAccessGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads/:leadId/notes')
export class LeadNoteController {
  constructor(private readonly leadNoteService: LeadNoteService) {}

  @RequirePermissions('lead:note:create')
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
