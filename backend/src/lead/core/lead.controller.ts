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
  UseInterceptors,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '@/src/log/enums/audit-log.enum';
import { Request } from 'express';
import { LeadService } from './lead.service';
import { LeadStatus } from '../enums/lead.enum';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadAccessGuard } from '../guards/lead.guard';
import { LeadNoteService } from '../note/lead-note.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { LeadSystemUserGuard } from '../guards/lead-system-user.guard';
import { LeadActivityService } from '../activity/lead-activity.service';
import { ResponseService } from '@/src/common/helpers/response.service';
import { LeadAssignmentService } from '../assignment/lead-assignment.service';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadAssignmentService: LeadAssignmentService,
    private readonly leadNoteService: LeadNoteService,
    private readonly leadActivityService: LeadActivityService,
  ) {}

  @RequirePermissions('lead:create')
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.LEAD,
  })
  @UseGuards(SystemUserGuard)
  @Post()
  async create(@Req() req: Request, @Body() createLeadDto: CreateLeadDto) {
    const lead = await this.leadService.create(
      Number(req?.user?.id),
      createLeadDto,
    );

    req.auditPayload = {
      targetId: lead.id,
      newValue: {
        email: lead.email,
        fullName: lead.fullName,
        status: lead.status,
      },
      description: `Create lead ${lead.id}`,
    };

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
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.LEAD,
  })
  @Patch(':leadId')
  async update(
    @Req() req: Request,
    @Body() updateLeadDto: UpdateLeadDto,
    @Param('leadId', ParseIntPipe) leadId: number,
  ) {
    const { lead, oldValue, newValue } = await this.leadService.update(
      Number(req?.user?.id),
      updateLeadDto,
      leadId,
    );

    req.auditPayload = {
      targetId: lead.id,
      newValue,
      oldValue,
      description: `Update lead #${lead.id}`,
    };

    return ResponseService.format(lead);
  }

  @RequirePermissions('lead:update')
  @UseGuards(LeadAccessGuard)
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.LEAD,
  })
  @Patch(':leadId/status')
  async changeStatus(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('status', new ParseEnumPipe(LeadStatus))
    status: LeadStatus,
  ) {
    const { oldValue, newValue } = await this.leadService.changeStatus(
      Number(req?.user?.id),
      leadId,
      status,
    );

    req.auditPayload = {
      targetId: leadId,
      newValue,
      oldValue,
      description: `Update lead #${leadId}`,
    };

    return ResponseService.format({
      message: 'Update lead status successfully!',
    });
  }

  @RequirePermissions('lead:assignment:update')
  @UseGuards(LeadSystemUserGuard)
  @Patch(':leadId/primary-agent')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.LEAD_ASSIGNMENT,
  })
  async changePrimaryAgent(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    const { oldValue, newValue } =
      await this.leadAssignmentService.changePrimaryAgent(
        Number(req?.user?.id),
        leadId,
        agentId,
      );

    req.auditPayload = {
      targetId: leadId,
      oldValue,
      newValue,
      description: `Change primary agent of lead #${leadId}`,
    };

    return ResponseService.format({
      message: 'Change primary agent successfully',
    });
  }
}
