import {
  Get,
  Query,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { LeadActivityService } from './lead-activity.service';
import { LeadAccessGuard } from '../guards/lead.guard';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '../../authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from 'src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '../../authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('activities')
export class LeadActivityController {
  constructor(private readonly leadActivityService: LeadActivityService) {}

  @RequirePermissions('lead:activity:read')
  @UseGuards(SystemUserGuard)
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { activities, total } =
      await this.leadActivityService.findAll(paginationDto);
    return ResponseService.format(activities, { total });
  }

  @RequirePermissions('lead:activity:read')
  @UseGuards(LeadAccessGuard)
  @Get(':activityId')
  async findOne(@Param('activityId', ParseIntPipe) activityId: number) {
    const activity = await this.leadActivityService.findOne(activityId);
    return ResponseService.format(activity);
  }
}
