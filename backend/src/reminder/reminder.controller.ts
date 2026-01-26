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

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @UseGuards(SuperAdminGuard)
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateReminderForUserDto) {
    const reminder = await this.reminderService.create(
      dto,
      Number(req?.user?.id),
    );
    return ResponseService.format(reminder);
  }

  @Post('me')
  async createSelf(@Req() req: Request, @Body() dto: CreateSelfReminderDto) {
    const reminder = await this.reminderService.createSelf(
      dto,
      Number(req?.user?.id),
    );
    return ResponseService.format(reminder);
  }

  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { reminders, total } = await this.reminderService.findAll(
      Number(req?.user?.id),
      paginationDto,
    );
    return ResponseService.format(reminders, { total });
  }

  @UseGuards(ReminderAccessGuard)
  @Get(':reminderId')
  async find(@Param('reminderId', ParseIntPipe) reminderId: number) {
    const reminder = await this.reminderService.findOne(reminderId);
    return ResponseService.format(reminder);
  }

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
