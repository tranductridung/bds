import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Patch,
  Param,
  Delete,
  Inject,
  UseGuards,
  Controller,
  forwardRef,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  PropertySystemStatus,
  PropertyBusinessStatus,
} from './enums/property.enum';
import { Request } from 'express';
import { PropertyService } from './property.service';
import { RatingService } from './rating/rating.service';
import { FeatureService } from '../feature/feature.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { CreateRatingDto } from './dto/rating/create-rating.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { PropertyAccessGuard } from './guards/property-access.guard';
import { ResponseService } from '../common/helpers/response.service';
import { PropertyAgentService } from './agent/property-agent.service';
import { SystemUserGuard } from '../authorization/guards/system-user.guard';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly featureService: FeatureService,
    private readonly propertyAgentService: PropertyAgentService,
    @Inject(forwardRef(() => RatingService))
    private readonly ratingService: RatingService,
  ) {}

  @RequirePermissions('property:create')
  @UseGuards(SystemUserGuard)
  @Post()
  async create(@Body() createpropertyDto: CreatePropertyDto) {
    const property = await this.propertyService.create(createpropertyDto);
    return ResponseService.format(property);
  }

  @RequirePermissions('property:read')
  @UseGuards(SystemUserGuard)
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
  @Get(':propertyId')
  async find(@Param('propertyId', ParseIntPipe) propertyId: number) {
    const property = await this.propertyService.findOne(propertyId);
    return ResponseService.format(property);
  }

  @RequirePermissions('property:update')
  @UseGuards(PropertyAccessGuard)
  @Patch(':propertyId')
  async update(
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const property = await this.propertyService.update(
      updatePropertyDto,
      propertyId,
    );
    return ResponseService.format(property);
  }

  @RequirePermissions('property:update')
  @UseGuards(SystemUserGuard)
  @Patch(':propertyId/system-status')
  async changeSystemStatus(
    @Req() req: Request,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('propertySystemStatus', new ParseEnumPipe(PropertySystemStatus))
    propertySystemStatus: PropertySystemStatus,
  ) {
    await this.propertyService.changeSystemStatus(
      propertyId,
      propertySystemStatus,
    );
    return ResponseService.format({
      message: 'Update property system status successfully!',
    });
  }

  @RequirePermissions('property:update')
  @UseGuards(PropertyAccessGuard)
  @Patch(':propertyId/business-status')
  async changeBusinessStatus(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('propertyBusinessStatus', new ParseEnumPipe(PropertyBusinessStatus))
    propertyBusinessStatus: PropertyBusinessStatus,
  ) {
    await this.propertyService.changeBusinessStatus(
      propertyId,
      propertyBusinessStatus,
    );
    return ResponseService.format({
      message: 'Update property business status successfully!',
    });
  }

  // PROPERTY RATING
  @RequirePermissions('property:rating:create')
  @UseGuards(PropertyAccessGuard)
  @Post(':propertyId/ratings')
  async createRating(
    @Body() createRatingDto: CreateRatingDto,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const property = await this.propertyService.findOne(propertyId);
    const rating = await this.ratingService.create(property, createRatingDto);
    return ResponseService.format(rating);
  }

  @RequirePermissions('property:rating:read')
  @UseGuards(PropertyAccessGuard)
  @Get(':propertyId/ratings')
  async findAllRatingsOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.propertyService.exist(propertyId);

    const { ratings, total } = await this.ratingService.findRatingsOfProperty(
      propertyId,
      paginationDto,
    );
    return ResponseService.format(ratings, { total });
  }

  // PROPERTY FEATURE
  @RequirePermissions('property:feature:create')
  @UseGuards(PropertyAccessGuard)
  @Post(':propertyId/features')
  async addFeatureToProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('featureId', ParseIntPipe) featureId: number,
  ) {
    const property = await this.propertyService.findOne(propertyId);

    const propertyFeature = await this.featureService.addFeatureToProperty(
      property,
      featureId,
    );
    return ResponseService.format(propertyFeature);
  }

  @RequirePermissions('property:feature:read')
  @Get(':propertyId/features')
  @UseGuards(PropertyAccessGuard)
  async getFeaturesOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.propertyService.exist(propertyId);

    const { features, total } = await this.featureService.getFeaturesOfProperty(
      propertyId,
      paginationDto,
    );
    return ResponseService.format(features, { total });
  }

  @RequirePermissions('property:feature:delete')
  @UseGuards(PropertyAccessGuard)
  @Delete(':propertyId/features/:featureId')
  async removeFeatureOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('featureId', ParseIntPipe) featureId: number,
  ) {
    await this.propertyService.exist(propertyId);

    await this.featureService.removeFeatureOfProperty(propertyId, featureId);
    return ResponseService.format({
      message: 'Remove feature of property successfully!',
    });
  }

  // PROPERTY AGENT
  @RequirePermissions('property:agent:create')
  @UseGuards(SystemUserGuard)
  @Post(':propertyId/agents')
  async addAgentToProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body('agentId', ParseIntPipe) agentId: number,
  ) {
    const property = await this.propertyService.findOne(propertyId);
    const propertyAgent = await this.propertyAgentService.addAgentToProperty(
      property,
      agentId,
    );
    return ResponseService.format(propertyAgent);
  }

  @RequirePermissions('property:agent:read')
  @Get(':propertyId/agents')
  @UseGuards(PropertyAccessGuard)
  async getAgentsOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    await this.propertyService.exist(propertyId);

    const { agents, total } =
      await this.propertyAgentService.getAgentsOfProperty(
        propertyId,
        paginationDto,
      );
    return ResponseService.format(agents, { total });
  }

  @RequirePermissions('property:agent:delete')
  @Delete(':propertyId/agents/:agentId')
  @UseGuards(SystemUserGuard)
  async removeAgentOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('agentId', ParseIntPipe) agentId: number,
  ) {
    await this.propertyService.exist(propertyId);
    await this.propertyAgentService.removeAgentOfProperty(propertyId, agentId);

    return ResponseService.format({
      message: 'Remove agent of property successfully!',
    });
  }
}
