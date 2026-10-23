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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '@/src/log/enums/audit-log.enum';
import {
  ApiMessageResponseDto,
  ApiResponseDto,
} from '@/src/common/dtos/api-response.dto';
import { Request } from 'express';
import { LeadService } from './lead.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { LeadResponseDto } from './dto/responses/lead-response.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { LeadSystemUserGuard } from '../guards/lead-system-user.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { ApiErrors } from '@/src/common/decorators/error-response.decorator';
import { LeadAssignmentService } from '../assignment/lead-assignment.service';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';
import { ChangeLeadStatusDto } from './dto/update-lead.dto copy';

@ApiTags('Lead')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadService,
    private readonly leadAssignmentService: LeadAssignmentService,
  ) {}

  @RequirePermissions('lead:create')
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.LEAD,
  })
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'Create new lead' })
  @ApiOkResponse({
    type: ApiResponseDto<LeadResponseDto>(LeadResponseDto),
    description: 'Lead created successfully',
  })
  @ApiErrors({
    statusCode: 409,
    message: 'Lead with this email already exists',
  })
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

  @ApiOperation({ summary: 'Get list of leads' })
  @ApiOkResponse({
    type: ApiResponseDto<LeadResponseDto>(LeadResponseDto, {
      isArray: true,
      isMeta: true,
    }),
    description: 'List of leads retrieved successfully',
  })
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

  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiOkResponse({
    type: ApiResponseDto<LeadResponseDto>(LeadResponseDto),
    description: 'Lead retrieved successfully',
  })
  @ApiErrors({ statusCode: 404, message: 'Lead not found!' })
  @RequirePermissions('lead:read')
  @UseGuards(LeadAccessGuard)
  @Get(':leadId')
  async find(@Param('leadId', ParseIntPipe) leadId: number) {
    const lead = await this.leadService.findOne(leadId);
    return ResponseService.format(lead);
  }

  @ApiOperation({ summary: 'Update a lead' })
  @ApiOkResponse({
    type: ApiResponseDto<LeadResponseDto>(LeadResponseDto),
    description: 'Lead updated successfully',
  })
  @ApiErrors({ statusCode: 404, message: 'Lead not found!' })
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
  @ApiOperation({ summary: 'Update lead status' })
  @ApiBody({ type: ChangeLeadStatusDto })
  @ApiOkResponse({
    type: ApiMessageResponseDto(
      'Update lead status successfully',
      'UpdateLeadStatusResponse',
    ),
    description: 'Lead status updated successfully',
  })
  @ApiErrors(
    { statusCode: 404, message: 'Lead not found!' },
    { statusCode: 400, message: 'Lead status is already "NEW"' },
  )
  @Patch(':leadId/status')
  async changeStatus(
    @Req() req: Request,
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() changeLeadStatusDto: ChangeLeadStatusDto,
  ) {
    const { oldValue, newValue } = await this.leadService.changeStatus(
      Number(req?.user?.id),
      leadId,
      changeLeadStatusDto.status,
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
  @ApiOperation({ summary: 'Change primary agent' })
  @ApiOkResponse({
    type: ApiMessageResponseDto(
      'Change primary agent successfully',
      'ChangePrimaryAgentResponse',
    ),
    description: 'Primary agent changed successfully',
  })
  @ApiErrors(
    { statusCode: 404, message: 'Lead not found!' },
    { statusCode: 400, message: 'User is already primary' },
    { statusCode: 400, message: 'Agent is not assigned to this lead' },
  )
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
