import {
  Get,
  Query,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { LeadNoteService } from './lead-note.service';
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('notes')
export class LeadNoteController {
  constructor(private readonly leadNoteService: LeadNoteService) {}

  @RequirePermissions('lead:note:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { notes, total } = await this.leadNoteService.findAll(paginationDto);
    return ResponseService.format(notes, { total });
  }

  @RequirePermissions('lead:note:read')
  @UseGuards(LeadAccessGuard)
  @Get(':noteId')
  async findOne(@Param('noteId', ParseIntPipe) noteId: number) {
    const note = await this.leadNoteService.findOne(noteId);
    return ResponseService.format(note);
  }
}
