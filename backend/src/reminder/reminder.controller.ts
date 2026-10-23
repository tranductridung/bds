import {
  Get,
  Req,
  Body,
  Post,
  Patch,
  Query,
  Param,
  UseGuards,
  Controller,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { ReminderService } from './reminder.service';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { ReminderAccessGuard } from './guards/reminder.guard';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { CreateSelfReminderDto } from './dto/create-self-reminder.dto';
import { SuperAdminGuard } from '../authorization/guards/superadmin.guard';
import { PermissionsGuard } from '../authorization/guards/permission.guard';
import { CreateReminderForUserDto } from './dto/create-reminder-for-user.dto';
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
@ApiTags('Reminders')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create a reminder for a user (Admin only)' })
  @ApiBody({ type: CreateReminderForUserDto })
  @ApiOkResponse({ description: 'Reminder created successfully' })
  @ApiErrorsOld(400, 404)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateReminderForUserDto) {
    const reminder = await this.reminderService.create(
      dto,
      Number(req?.user?.id),
    );
    return ResponseService.format(reminder);
  }

  @ApiOperation({ summary: 'Create a reminder for yourself' })
  @ApiBody({ type: CreateSelfReminderDto })
  @ApiOkResponse({ description: 'Reminder created successfully' })
  @ApiErrorsOld(400)
  @Post('me')
  async createSelf(@Req() req: Request, @Body() dto: CreateSelfReminderDto) {
    const reminder = await this.reminderService.createSelf(
      dto,
      Number(req?.user?.id),
    );
    return ResponseService.format(reminder);
  }

  @ApiOperation({ summary: 'List all reminders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Reminders retrieved successfully' })
  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { reminders, total } = await this.reminderService.findAll(
      Number(req?.user?.id),
      paginationDto,
    );
    return ResponseService.format(reminders, { total });
  }

  @UseGuards(ReminderAccessGuard)
  @ApiOperation({ summary: 'Get reminder by ID' })
  @ApiParam({ name: 'reminderId', description: 'Reminder ID', type: 'number' })
  @ApiOkResponse({ description: 'Reminder retrieved successfully' })
  @ApiErrorsOld(403, 404)
  @Get(':reminderId')
  async find(@Param('reminderId', ParseIntPipe) reminderId: number) {
    const reminder = await this.reminderService.findOne(reminderId);
    return ResponseService.format(reminder);
  }

  @ApiOperation({ summary: 'Update reminder' })
  @ApiParam({ name: 'reminderId', description: 'Reminder ID', type: 'number' })
  @ApiBody({ type: UpdateReminderDto })
  @ApiOkResponse({ description: 'Reminder updated successfully' })
  @ApiErrorsOld(400, 404)
  @Patch(':reminderId')
  async update(
    @Req() req: Request,
    @Param('reminderId', ParseIntPipe) reminderId: number,
    @Body() dto: UpdateReminderDto,
  ) {
    const reminder = await this.reminderService.update(
      Number(req?.user?.id),
      reminderId,
      dto,
    );
    return ResponseService.format(reminder);
  }
}
