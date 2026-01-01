import {
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Controller,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';

@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@RequirePermissions('log:audit:read')
@Controller('logs/audits')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { auditLogs, total } =
      await this.auditLogService.findAll(paginationDto);
    return ResponseService.format(auditLogs, {
      total,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  @Get(':auditLogId')
  async find(@Param('auditLogId', ParseIntPipe) auditLogId: number) {
    const auditLog = await this.auditLogService.findOne(auditLogId);
    return ResponseService.format(auditLog);
  }
}
