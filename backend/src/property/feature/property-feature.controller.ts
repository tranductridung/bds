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
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { PropertyFeatureService } from './property-feature.service';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
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

@ApiTags('Property Features')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, PropertyAccessGuard)
@Controller('properties/:propertyId/features')
export class PropertyFeatureController {
  constructor(
    private readonly propertyFeatureService: PropertyFeatureService,
  ) {}

  @RequirePermissions('property:feature:create')
  @ApiOperation({ summary: 'Add a feature to a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({ schema: { properties: { featureId: { type: 'number' } } } })
  @ApiOkResponse({ description: 'Feature added to property successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.PROPERTY_FEATURE,
  })
  async addFeatureToProperty(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('featureId', ParseIntPipe) featureId: number,
  ) {
    const propertyFeature =
      await this.propertyFeatureService.addFeatureToProperty(
        propertyId,
        featureId,
      );

    req.auditPayload = {
      targetId: propertyFeature.id,
      newValue: { featureId: propertyFeature.feature.id },
      description: `Add feature #${propertyFeature.feature.id} to property #${propertyFeature.property.id}`,
    };

    return ResponseService.format(propertyFeature);
  }

  @RequirePermissions('property:feature:read')
  @ApiOperation({ summary: 'Get all features for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Property features retrieved successfully' })
  @ApiErrorsOld(404)
  @Get()
  async getFeaturesOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { features, total } =
      await this.propertyFeatureService.getFeaturesOfProperty(
        propertyId,
        paginationDto,
      );
    return ResponseService.format(features, { total });
  }

  @RequirePermissions('property:feature:delete')
  @ApiOperation({ summary: 'Remove a feature from a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiParam({ name: 'featureId', description: 'Feature ID', type: 'number' })
  @ApiOkResponse({ description: 'Feature removed from property successfully' })
  @ApiErrorsOld(404)
  @Delete(':featureId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.PROPERTY_FEATURE,
  })
  async removeFeatureOfProperty(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    const propertyFeature =
      await this.propertyFeatureService.removeFeatureOfProperty(
        propertyId,
        featureId,
      );

    req.auditPayload = {
      targetId: propertyFeature.id,
      oldValue: { featureId: propertyFeature.feature.id },
      description: `Remove feature #${propertyFeature.feature.id} of property #${propertyFeature.property.id}`,
    };

    return ResponseService.format({
      message: 'Remove feature of property successfully!',
    });
  }
}
