import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from 'src/app.service';

@ApiTags('gateway-health')
@Controller('gateway-health')
export class HealthController {
  constructor(private readonly gatWayService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Check User Service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  checkHealth() {
    return this.gatWayService.checkHealth();
  }
}
