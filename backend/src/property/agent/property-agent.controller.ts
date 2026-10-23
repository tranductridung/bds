import {
  Req,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '@/src/log/enums/audit-log.enum';
import { Request } from 'express';
import { PropertyAgentService } from './property-agent.service';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PropertySystemUserGuard } from '../guards/property-system-user.guard';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';
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

@ApiTags('Property Agents')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('properties/:propertyId/agents')
export class PropertyAgentController {
  constructor(private readonly propertyAgentService: PropertyAgentService) {}

  @RequirePermissions('property:agent:create')
  @UseGuards(PropertySystemUserGuard)
  @ApiOperation({ summary: 'Add an agent to a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({ schema: { properties: { agentId: { type: 'number' } } } })
  @ApiOkResponse({ description: 'Agent added to property successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.PROPERTY_AGENT,
  })
  async addAgentToProperty(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    const propertyAgent = await this.propertyAgentService.addAgentToProperty(
      Number(req?.user?.id),
      propertyId,
      agentId,
    );

    req.auditPayload = {
      targetId: propertyAgent.id,
      newValue: { agentId: propertyAgent.agent.id },
      description: `Create note for lead #${propertyAgent.id}`,
    };

    return ResponseService.format(propertyAgent);
  }

  @RequirePermissions('property:agent:read')
  @Get()
  @UseGuards(PropertyAccessGuard)
  @ApiOperation({ summary: 'Get all agents for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Property agents retrieved successfully' })
  @ApiErrorsOld(404)
  async getAgentsOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { agents, total } =
      await this.propertyAgentService.getAgentsOfProperty(
        propertyId,
        paginationDto,
      );
    return ResponseService.format(agents, { total });
  }

  @RequirePermissions('property:agent:delete')
  @ApiOperation({ summary: 'Remove an agent from a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiParam({ name: 'agentId', description: 'Agent ID', type: 'number' })
  @ApiOkResponse({ description: 'Agent removed from property successfully' })
  @ApiErrorsOld(404)
  @Delete(':agentId')
  @UseGuards(PropertySystemUserGuard)
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.PROPERTY_AGENT,
  })
  async removeAgentOfProperty(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('agentId', ParseIntPipe) agentId: number,
  ) {
    const propertyAgent = await this.propertyAgentService.removeAgentOfProperty(
      Number(req?.user?.id),
      propertyId,
      agentId,
    );

    req.auditPayload = {
      targetId: propertyAgent.id,
      oldValue: { agentId: propertyAgent.agent.id },
      description: `Remove agent #${propertyAgent.agent.id} of property #${propertyAgent.property.id}`,
    };

    return ResponseService.format({
      message: 'Remove agent of property successfully!',
    });
  }
}
