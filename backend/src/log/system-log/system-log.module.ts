import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { AllExceptionsFilter } from './filters/app-exception.filter';
@Module({
  providers: [SystemLogService, AllExceptionsFilter],
  exports: [SystemLogService],
})
export class SystemLogModule {}
