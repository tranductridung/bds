import {
  Get,
  Req,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { RatingService } from './rating.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { UpdateRatingDto } from '../dto/rating/update-rating.dto';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { PropertyAccessGuard } from '../guards/property-access.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('ratings')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @RequirePermissions('rating:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { ratings, total } = await this.ratingService.findAll(paginationDto);
    return ResponseService.format(ratings, { total });
  }

  @RequirePermissions('rating:read')
  @UseGuards(PropertyAccessGuard)
  @Get(':ratingId')
  async findOne(@Param('ratingId', ParseIntPipe) ratingId: number) {
    const rating = await this.ratingService.findOne(ratingId);
    return ResponseService.format(rating);
  }

  @RequirePermissions('rating:update')
  @UseGuards(PropertyAccessGuard)
  @Patch(':ratingId')
  async update(
    @Req() req: Request,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    const rating = await this.ratingService.update(ratingId, updateRatingDto);

    return ResponseService.format(rating);
  }

  @RequirePermissions('rating:delete')
  @UseGuards(PropertyAccessGuard)
  @Delete(':ratingId')
  async remove(@Param('ratingId', ParseIntPipe) ratingId: number) {
    await this.ratingService.remove(ratingId);
    return ResponseService.format({ message: 'Remove rating successfully!' });
  }
}
