import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Check app live or not',
    description: 'Not check database. Use for Render health check.',
  })
  @ApiOkResponse({
    description: 'App is running',
    schema: {
      example: { status: 'ok', uptime: 1234.56 },
    },
  })
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Check app and databse connection',
    description: 'Use for CI/Docker to wait app ready.',
  })
  @ApiOkResponse({
    description: 'App and databse are running',
    schema: {
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'At least 1 factor not running',
    schema: {
      example: {
        status: 'error',
        info: {},
        error: { database: { status: 'down', message: 'Connection lost' } },
        details: { database: { status: 'down', message: 'Connection lost' } },
      },
    },
  })
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
