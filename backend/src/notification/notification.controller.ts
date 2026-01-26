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
import { NotificationService } from './notification.service';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { AuthJwtGuard } from '../authentication/guards/auth.guard';
import { ResponseService } from '../common/helpers/response.service';
import { NotificationOwnerGuard } from './guards/notification-owner.guard';
import { PermissionsGuard } from '../authorization/guards/permission.guard';
import { RequirePermissions } from '../authentication/decorators/permissions.decorator';
import { RefreshTokenService } from '../refresh-token/refresh-token.service';

@UseGuards(AuthJwtGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Get('test')
  async test(@Res() res: Response) {
    const now = new Date();
    await this.refreshTokenService.cleanupExpiredTokens(now);
    return res.json({ message: 'Notification service is working' });
  }

  @RequirePermissions('notification:read')
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
  @Get(':notificationId')
  async find(@Param('notificationId', ParseIntPipe) notificationId: number) {
    const notification = await this.notificationService.findOne(notificationId);
    return ResponseService.format(notification);
  }

  @UseGuards(NotificationOwnerGuard)
  @RequirePermissions('notification:delete')
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
