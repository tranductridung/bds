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
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { LeadAssignmentService } from './lead-assignment.service';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { LeadSystemUserGuard } from '../guards/lead-system-user.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';

@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @RequirePermissions('lead:assignment:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { assignments, total } =
      await this.leadAssignmentService.findAll(paginationDto);
    return ResponseService.format(assignments, { total });
  }
}

@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads/:leadId/assignments')
export class LeadAssignmentController {
  constructor(private readonly leadAssignmentService: LeadAssignmentService) {}

  @RequirePermissions('lead:assignment:create')
  @UseGuards(LeadAccessGuard)
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
