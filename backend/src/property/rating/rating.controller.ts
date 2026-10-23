import {
  Get,
  Req,
  Post,
  Body,
  Query,
  Param,
  Patch,
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
import { RatingService } from './rating.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuditLog } from '@/src/log/decorators/audit.decorator';
import { CreateRatingDto } from '../dto/rating/create-rating.dto';
import { UpdateRatingDto } from '../dto/rating/update-rating.dto';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { AuditInterceptor } from '@/src/log/audit-log/interceptors/audit-log.interceptor';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiErrorsOld } from '@/src/common/decorators/error-response.decorator';

@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @RequirePermissions('property:rating:read')
  @UseGuards(SystemUserGuard)
  @ApiOperation({ summary: 'List all ratings with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Ratings retrieved successfully' })
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { ratings, total } = await this.ratingService.findAll(paginationDto);
    return ResponseService.format(ratings, { total });
  }
}

@ApiTags('Property Ratings')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, PropertyAccessGuard)
@UseInterceptors(AuditInterceptor)
@Controller('properties/:propertyId/ratings')
export class PropertyRatingController {
  constructor(private readonly ratingService: RatingService) {}

  @RequirePermissions('property:rating:create')
  @ApiOperation({ summary: 'Create a new rating for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiBody({ type: CreateRatingDto })
  @ApiOkResponse({ description: 'Rating created successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  @AuditLog({
    action: AuditLogAction.CREATE,
    targetType: AuditLogTargetType.PROPERTY_RATING,
  })
  async createRating(
    @Req() req: Request,
    @Body() createRatingDto: CreateRatingDto,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const rating = await this.ratingService.create(propertyId, createRatingDto);

    req.auditPayload = {
      targetId: rating.id,
      newValue: {
        rating: rating.rating,
        comment: rating.comment?.slice(0, 50),
      },
      description: `Remove rating #${rating.id}} of property #${propertyId}`,
    };

    return ResponseService.format(rating);
  }

  @RequirePermissions('property:rating:read')
  @ApiOperation({ summary: 'List all ratings for a property' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Property ratings retrieved successfully' })
  @Get()
  async findAllRatingsOfProperty(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    const { ratings, total } = await this.ratingService.findRatingsOfProperty(
      propertyId,
      paginationDto,
    );
    return ResponseService.format(ratings, { total });
  }

  @RequirePermissions('property:rating:update')
  @ApiOperation({ summary: 'Update a property rating' })
  @ApiParam({ name: 'propertyId', description: 'Property ID', type: 'number' })
  @ApiParam({ name: 'ratingId', description: 'Rating ID', type: 'number' })
  @ApiBody({ type: UpdateRatingDto })
  @ApiOkResponse({ description: 'Rating updated successfully' })
  @ApiErrorsOld(400, 404)
  @Patch(':ratingId')
  @AuditLog({
    action: AuditLogAction.UPDATE,
    targetType: AuditLogTargetType.PROPERTY_RATING,
  })
  async updateRating(
    @Req() req: Request,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    const { rating, oldValue, newValue } = await this.ratingService.update(
      propertyId,
      ratingId,
      updateRatingDto,
    );

    req.auditPayload = {
      targetId: rating.id,
      oldValue,
      newValue,
      description: `Update rating #${ratingId}} of property #${propertyId}`,
    };

    return ResponseService.format(rating);
  }

  @RequirePermissions('property:rating:delete')
  @Delete(':ratingId')
  @AuditLog({
    action: AuditLogAction.DELETE,
    targetType: AuditLogTargetType.PROPERTY_RATING,
  })
  async removeRating(
    @Req() req: Request,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Param('propertyId', ParseIntPipe) propertyId: number,
  ) {
    const { oldValue } = await this.ratingService.remove(propertyId, ratingId);

    req.auditPayload = {
      targetId: ratingId,
      oldValue,
      description: `Remove rating #${ratingId}} of property #${propertyId}`,
    };

    return ResponseService.format({ message: 'Remove rating successfully!' });
  }

  @RequirePermissions('property:rating:read')
  @Get(':ratingId')
  async findOne(
    @Param('propertyId', ParseIntPipe) propertyId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
  ) {
    const rating = await this.ratingService.findRatingOfProperty(
      propertyId,
      ratingId,
    );
    return ResponseService.format(rating);
  }
}
