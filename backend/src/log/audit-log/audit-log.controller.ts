import {
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  Controller,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { PaginationDto } from '@/src/common/dtos/pagination.dto';
import { AuthJwtGuard } from '@/src/authentication/guards/auth.guard';
import { ResponseService } from '@/src/common/helpers/response.service';
import { PermissionsGuard } from '@/src/authorization/guards/permission.guard';
import { SystemUserGuard } from '@/src/authorization/guards/system-user.guard';
import { RequirePermissions } from '@/src/authentication/decorators/permissions.decorator';
import { ApiErrorsOld } from '@/src/common/decorators/error-response.decorator';

@ApiTags('Audit Logs')
@ApiBearerAuth('access-token')
@UseGuards(AuthJwtGuard, PermissionsGuard, SystemUserGuard)
@RequirePermissions('log:audit:read')
@Controller('logs/audits')
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @ApiOperation({ summary: 'List all audit logs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiOkResponse({ description: 'Audit logs retrieved successfully' })
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

  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'auditLogId', description: 'Audit Log ID', type: 'number' })
  @ApiOkResponse({ description: 'Audit log retrieved successfully' })
  @ApiErrorsOld(404)
  @Get(':auditLogId')
  async find(@Param('auditLogId', ParseIntPipe) auditLogId: number) {
    const auditLog = await this.auditLogService.findOne(auditLogId);
    return ResponseService.format(auditLog);
  }
}
