import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getSafeUptime } from '../utils/uptime.util';

@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check User Service health' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy'
  })
  checkHealth() {
    return {
      success: true,
      message: 'User Service is healthy',
      data: {
        service: 'user-service',
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: getSafeUptime(),
      },
    };
  }
}