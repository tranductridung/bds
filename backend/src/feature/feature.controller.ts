import {
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
} from '@nestjs/common';
import { FeatureService } from './feature.service';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { UpdateFeatureDto } from './dto/update-feature.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { SystemUserGuard } from '../authorization/guards/system-user.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @RequirePermissions('property:feature:create')
  @UseGuards(SystemUserGuard)
  @Post()
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    const feature = await this.featureService.create(createFeatureDto);
    return ResponseService.format(feature);
  }

  @RequirePermissions('property:feature:read')
  @UseGuards(SystemUserGuard)
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

  @RequirePermissions('property:feature:read')
  @UseGuards(SystemUserGuard)
  @Get(':featureId')
  async find(@Param('featureId', ParseIntPipe) featureId: number) {
    const feature = await this.featureService.findOne(featureId);
    return ResponseService.format(feature);
  }

  @RequirePermissions('property:feature:update')
  @UseGuards(SystemUserGuard)
  @Patch(':featureId')
  async update(
    @Body() updateFeatureDto: UpdateFeatureDto,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    const feature = await this.featureService.update(
      updateFeatureDto,
      featureId,
    );
    return ResponseService.format(feature);
  }

  @RequirePermissions('property:feature:delete')
  @Delete(':featureId')
  @UseGuards(SystemUserGuard)
  async remove(@Param('featureId', ParseIntPipe) featureId: number) {
    await this.featureService.remove(featureId);
    return ResponseService.format({ message: 'Feature removed successfully' });
  }
}
