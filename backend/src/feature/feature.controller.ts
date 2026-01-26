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
  AuditLogAction,
  AuditLogTargetType,
} from '../log/enums/audit-log.enum';
import { Request } from 'express';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { AuditLog } from '../log/decorators/audit.decorator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { SystemUserGuard } from '../authorization/guards/system-user.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import { AuditInterceptor } from '../log/audit-log/interceptors/audit-log.interceptor';

@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@UseInterceptors(AuditInterceptor)
@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

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

  @RequirePermissions('feature:read')
  @Get(':featureId')
  async find(@Param('featureId', ParseIntPipe) featureId: number) {
    const feature = await this.featureService.findOne(featureId);
    return ResponseService.format(feature);
  }

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
