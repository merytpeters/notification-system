import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from 'src/app.service';


@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Check User Service health' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  checkHealth() {
    return this.healthService.checkHealth();
  }
}
