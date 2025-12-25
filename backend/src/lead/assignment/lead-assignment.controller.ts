import {
  Get,
  Query,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { LeadAssignmentService } from './lead-assignment.service';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('assignments')
export class LeadAssignmentController {
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @RequirePermissions('lead:assignment:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { assignments, total } =
      await this.leadAssignmentService.findAll(paginationDto);
    return ResponseService.format(assignments, { total });
  }

  @RequirePermissions('lead:assignment:read')
  @UseGuards(LeadAccessGuard)
  @Get(':assignmentId')
  async findOne(@Param('assignmentId', ParseIntPipe) assignmentId: number) {
    const assignment = await this.leadAssignmentService.findOne(assignmentId);
    return ResponseService.format(assignment);
  }
}
