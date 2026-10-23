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
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuditLogAction,
  AuditLogTargetType,
} from '../log/enums/audit-log.enum';
import { Request } from 'express';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { AuditLog } from '../log/decorators/audit.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import {
  ApiMessageResponseDto,
  ApiResponseDto,
} from '../common/dtos/api-response.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { ApiErrors } from '../common/decorators/error-response.decorator';
import { FeatureResponseDto } from './dto/responses/feature-response.dto';
import { SystemUserGuard } from '../authorization/guards/system-user.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { AuditInterceptor } from '../log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@ApiTags('Feature')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@UseInterceptors(AuditInterceptor)
@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @ApiOperation({ summary: 'Create a new feature' })
  @ApiBody({ type: CreateFeatureDto })
  @ApiOkResponse({
    type: ApiResponseDto<FeatureResponseDto>(FeatureResponseDto),
    description: 'Feature created successfully',
  })
  @ApiErrors({ statusCode: 409, message: 'Feature name already exists' })
  @RequirePermissions('feature:create')
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.FEATURE,
  })
  async create(
    @Req() req: Request,
    @Body() createFeatureDto: CreateFeatureDto,
  ) {
    const feature = await this.featureService.create(createFeatureDto);

    req.auditPayload = {
      targetId: feature.id,
      newValue: { name: feature.name },
      description: `Create feature #${feature.id}`,
    };

    return ResponseService.format(feature);
  }

  @ApiOperation({ summary: 'Get list of features' })
  @ApiOkResponse({
    type: ApiResponseDto<FeatureResponseDto>(FeatureResponseDto, {
      isArray: true,
      isMeta: true,
    }),
    description: 'List of features retrieved successfully',
  })
  @RequirePermissions('feature:read')
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { features, total } =
      await this.featureService.findAll(paginationDto);

    return ResponseService.format(features, {
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  @ApiOperation({ summary: 'Get feature by ID' })
  @ApiOkResponse({
    type: ApiResponseDto<FeatureResponseDto>(FeatureResponseDto),
    description: 'Feature retrieved successfully',
  })
  @ApiErrors({ statusCode: 404, message: 'Feature not found!' })
  @RequirePermissions('feature:read')
  @Get(':featureId')
  async find(@Param('featureId', ParseIntPipe) featureId: number) {
    const feature = await this.featureService.findOne(featureId);
    return ResponseService.format(feature);
  }

  @ApiOperation({ summary: 'Update a feature' })
  @ApiOkResponse({
    type: ApiResponseDto<FeatureResponseDto>(FeatureResponseDto),
    description: 'Feature updated successfully',
  })
  @ApiErrors(
    { statusCode: 404, message: 'Feature not found!' },
    { statusCode: 409, message: 'Feature name already exists' },
  )
  @RequirePermissions('feature:update')
  @Patch(':featureId')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.FEATURE,
  })
  async update(
    @Req() req: Request,
    @Body() updateFeatureDto: UpdateFeatureDto,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    const { feature, oldValue, newValue } = await this.featureService.update(
      updateFeatureDto,
      featureId,
    );

    req.auditPayload = {
      targetId: feature.id,
      newValue,
      oldValue,
      description: `Update feature #${feature.id}`,
    };

    return ResponseService.format(feature);
  }

  @ApiOperation({ summary: 'Delete a feature' })
  @ApiOkResponse({
    type: ApiMessageResponseDto(
      'Feature removed successfully',
      'FeatureRemovedResponse',
    ),
    description: 'Feature removed successfully',
  })
  @ApiErrors({ statusCode: 404, message: 'Feature not found!' })
  @RequirePermissions('feature:delete')
  @Delete(':featureId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.FEATURE,
  })
  async remove(
    @Req() req: Request,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    const { oldValue } = await this.featureService.remove(featureId);

    req.auditPayload = {
      targetId: featureId,
      oldValue,
      description: `Remove feature #${featureId}`,
    };

    return ResponseService.format({ message: 'Feature removed successfully' });
  }
}
