import { Module } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
@Module({
  providers: [SystemLogService],
  exports: [SystemLogService],
})
export class SystemLogModule {}
