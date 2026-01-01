import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { AuditInterceptor } from './interceptors/audit-log.interceptor';
import { AuthorizationModule } from '@/src/authorization/authorization.module';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), AuthorizationModule],
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditInterceptor],
  exports: [AuditLogService, AuditInterceptor],
})
export class AuditLogModule {}
