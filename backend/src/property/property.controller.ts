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
} from '@nestjs/common';
import {
  PropertySystemStatus,
  PropertyBusinessStatus,
} from './enums/property.enum';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '../log/enums/audit-log.enum';
import { Request } from 'express';
import { PropertyService } from './property.service';
import { AuditLog } from '../log/decorators/audit.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { PropertyAccessGuard } from './guards/property-access.guard';
import { ResponseService } from '../common/helpers/response.service';
import { SystemUserGuard } from '../authorization/guards/system-user.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { PropertySystemUserGuard } from './guards/property-system-user.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorsOld } from '../common/decorators/error-response.decorator';

@ApiTags('Properties')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @RequirePermissions('property:create')
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'Create a new property' })
  @ApiBody({ type: CreatePropertyDto })
  @ApiOkResponse({ description: 'Property created successfully' })
  @ApiErrorsOld(400, 409)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.PROPERTY,
  })
  async create(
    @Req() req: Request,
    @Body() createpropertyDto: CreatePropertyDto,
  ) {
    const property = await this.propertyService.create(createpropertyDto);
    req.auditPayload = {
      targetId: property.id,
      newValue: {
        name: property.name,
        price: property.price,
        businessStatus: property.businessStatus,
        systemStatus: property.systemStatus,
      },
      description: `Create property #${property.id}`,
    };

    return ResponseService.format(property);
  }

  @RequirePermissions('property:read')
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'List all properties with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Properties retrieved successfully' })
  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { properties, total } = await this.propertyService.findAll(
      Number(req?.user?.id),
      paginationDto,
    );

    return ResponseService.format(properties, { total });
  }

  @RequirePermissions('property:read')
  @UseGuards(PropertyAccessGuard)
  @ApiOperation({ summary: 'Get property details by ID' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiOkResponse({ description: 'Property details retrieved' })
  @ApiErrorsOld(404)
  @Get(':propertyId')
  async find(@Param('propertyId', ParseIntPipe) propertyId: number) {
    const property = await this.propertyService.findOne(propertyId);

    return ResponseService.format(property);
  }

  @RequirePermissions('property:update')
  @UseGuards(PropertyAccessGuard)
  @ApiOperation({ summary: 'Update property details' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiOkResponse({ description: 'Property updated successfully' })
  @ApiErrorsOld(400, 404)
  @Patch(':propertyId')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.PROPERTY,
  })
  async update(
    @Req() req: Request,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const { oldValue, newValue, property } = await this.propertyService.update(
      updatePropertyDto,
      propertyId,
    );

    req.auditPayload = {
      targetId: propertyId,
      oldValue,
      newValue,
      description: `Update property #${propertyId}`,
    };

    return ResponseService.format(property);
  }

  @RequirePermissions('property:update')
  @UseGuards(PropertySystemUserGuard)
  @ApiOperation({ summary: 'Change property system status' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({
    schema: {
      properties: {
        propertySystemStatus: { enum: Object.values(PropertySystemStatus) },
      },
    },
  })
  @ApiOkResponse({ description: 'Property system status updated' })
  @ApiErrorsOld(400, 404)
  @Patch(':propertyId/system-status')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.PROPERTY,
  })
  async changeSystemStatus(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('propertySystemStatus', new ParseEnumPipe(PropertySystemStatus))
    propertySystemStatus: PropertySystemStatus,
  ) {
    const { oldValue, newValue } =
      await this.propertyService.changeSystemStatus(
        Number(req?.user?.id),
        propertyId,
        propertySystemStatus,
      );

    req.auditPayload = {
      targetId: propertyId,
      oldValue,
      newValue,
      description: `Change system status of property #${propertyId}`,
    };

    return ResponseService.format({
      message: 'Update property system status successfully!',
    });
  }

  @RequirePermissions('property:update')
  @UseGuards(PropertyAccessGuard)
  @ApiOperation({ summary: 'Change property business status' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({
    schema: {
      properties: {
        propertyBusinessStatus: { enum: Object.values(PropertyBusinessStatus) },
      },
    },
  })
  @ApiOkResponse({ description: 'Property business status updated' })
  @ApiErrorsOld(400, 404)
  @Patch(':propertyId/business-status')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.PROPERTY,
  })
  async changeBusinessStatus(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('propertyBusinessStatus', new ParseEnumPipe(PropertyBusinessStatus))
    propertyBusinessStatus: PropertyBusinessStatus,
  ) {
    const { oldValue, newValue } =
      await this.propertyService.changeBusinessStatus(
        Number(req?.user?.id),
        propertyId,
        propertyBusinessStatus,
      );

    req.auditPayload = {
      targetId: propertyId,
      oldValue,
      newValue,
      description: `Change business status of property #${propertyId}`,
    };

    return ResponseService.format({
      message: 'Change property business status successfully!',
    });
  }
}
