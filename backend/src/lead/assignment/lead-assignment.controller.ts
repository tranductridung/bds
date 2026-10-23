import {
  Req,
  Get,
  Query,
  Param,
  Body,
  Post,
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
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { LeadAssignmentService } from './lead-assignment.service';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { LeadSystemUserGuard } from '../guards/lead-system-user.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
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
@ApiTags('Lead Assignments')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @RequirePermissions('lead:assignment:read')
  @ApiOperation({ summary: 'List all lead assignments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Lead assignments retrieved successfully' })
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { assignments, total } =
      await this.leadAssignmentService.findAll(paginationDto);
    return ResponseService.format(assignments, { total });
  }
}

@ApiTags('Lead Assignments Management')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads/:leadId/assignments')
export class LeadAssignmentController {
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @RequirePermissions('lead:assignment:create')
  @UseGuards(LeadAccessGuard)
  @ApiOperation({ summary: 'Create a new assignment for a lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiBody({ schema: { properties: { agentId: { type: 'number' } } } })
  @ApiOkResponse({ description: 'Assignment created successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.LEAD_ASSIGNMENT,
  })
  async creatAssignment(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    const { assignment, newValue } = await this.leadAssignmentService.create(
      Number(req?.user?.id),
      leadId,
      agentId,
    );

    req.auditPayload = {
      targetId: assignment.id,
      newValue,
      description: `Create assignment for #${leadId}`,
    };

    return ResponseService.format(assignment);
  }

  @RequirePermissions('lead:assignment:read')
  @UseGuards(LeadAccessGuard)
  @ApiOperation({ summary: 'List all assignments for a lead' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Lead assignments retrieved successfully' })
  @ApiErrorsOld(404)
  @Get()
  async findAllAssignmentsOfLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { assignments, total } =
      await this.leadAssignmentService.getAssignmentsOfLead(
        leadId,
        paginationDto,
      );
    return ResponseService.format(assignments, { total });
  }

  @RequirePermissions('lead:assignment:delete')
  @UseGuards(LeadSystemUserGuard)
  @ApiOperation({ summary: 'Delete an assignment' })
  @ApiParam({ name: 'leadId', description: 'Lead ID', type: 'number' })
  @ApiParam({
    name: 'assignmentId',
    description: 'Assignment ID',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Assignment deleted successfully' })
  @ApiErrorsOld(404)
  @Delete(':assignmentId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.LEAD_ASSIGNMENT,
  })
  async remove(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    const { oldValue } = await this.leadAssignmentService.remove(
      Number(req?.user?.id),
      leadId,
      assignmentId,
    );

    req.auditPayload = {
      targetId: assignmentId,
      oldValue,
      description: `Remove assignment of lead #${leadId}`,
    };

    return ResponseService.format({
      message: 'Remove assignment successfully!',
    });
  }

  @RequirePermissions('lead:assignment:read')
  @UseGuards(LeadAccessGuard)
  @Get(':assignmentId')
  async findOne(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    const assignment = await this.leadAssignmentService.findAssignmentOfLead(
      leadId,
      assignmentId,
    );
    return ResponseService.format(assignment);
  }
}
