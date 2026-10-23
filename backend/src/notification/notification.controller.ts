import {
  Get,
  Req,
  Param,
  Query,
  Patch,
  Delete,
  UseGuards,
  Controller,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { NotificationOwnerGuard } from './guards/notification-owner.guard';
import { PermissionsGuard } from '../authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';
import { ApiErrorsOld } from '../common/decorators/error-response.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @ApiOperation({ summary: 'Test notification service health' })
  @ApiOkResponse({ description: 'Service is working' })
  @Get('test')
  async test(@Res() res: Response) {
    const now = new Date();
    await this.refreshTokenService.cleanupExpiredTokens(now);
    return res.json({ message: 'Notification service is working' });
  }

  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'List all notifications with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Notifications retrieved successfully' })
  @Get()
  async findAll(@Req() req: Request, @Query() paginationDto: PaginationDto) {
    const { notifications, total } = await this.notificationService.findAll(
      Number(req?.user?.id),
      paginationDto,
    );

    return ResponseService.format(notifications, {
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  @UseGuards(NotificationOwnerGuard)
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Notification retrieved successfully' })
  @ApiErrorsOld(403, 404)
  @Get(':notificationId')
  async find(@Param('notificationId', ParseIntPipe) notificationId: number) {
    const notification = await this.notificationService.findOne(notificationId);
    return ResponseService.format(notification);
  }

  @UseGuards(NotificationOwnerGuard)
  @RequirePermissions('notification:delete')
  @ApiOperation({ summary: 'Delete notification by ID' })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Notification deleted successfully' })
  @ApiErrorsOld(403, 404)
  @Delete(':notificationId')
  async remove(
    @Req() req: Request,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    await this.notificationService.remove(
      notificationId,
      Number(req?.user?.id),
    );

    return ResponseService.format({
      message: 'Notification removed successfully',
    });
  }

  @UseGuards(NotificationOwnerGuard)
  @RequirePermissions('notification:update')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Notification marked as read' })
  @ApiErrorsOld(403, 404)
  @Patch(':notificationId/read')
  async markAsRead(
    @Req() req: Request,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    await this.notificationService.markAsRead(
      notificationId,
      Number(req?.user?.id),
    );

    return ResponseService.format({ message: 'Notification mark as read' });
  }

  @UseGuards(NotificationOwnerGuard)
  @RequirePermissions('notification:update')
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiParam({
    name: 'notificationId',
    description: 'Notification ID',
    type: 'number',
  })
  @ApiOkResponse({ description: 'Notification marked as unread' })
  @ApiErrorsOld(403, 404)
  @Patch(':notificationId/unread')
  async markAsUnread(
    @Req() req: Request,
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    await this.notificationService.markAsUnread(
      notificationId,
      Number(req?.user?.id),
    );

    return ResponseService.format({ message: 'Notification mark as unread' });
  }
}
