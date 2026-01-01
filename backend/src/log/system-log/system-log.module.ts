import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { SystemLogController } from './system-log.controller';
import { AllExceptionsFilter } from './filters/app-exception.filter';

@Module({
  controllers: [SystemLogController],
  providers: [SystemLogService, AllExceptionsFilter],
  exports: [SystemLogService],
})
export class SystemLogModule {}
