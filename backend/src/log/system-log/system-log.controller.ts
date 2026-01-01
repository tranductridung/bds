import { Controller } from '@nestjs/common';
import { SystemLogService } from './system-log.service';

@Controller('system-log')
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}
}
