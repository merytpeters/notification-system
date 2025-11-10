import { Module } from '@nestjs/common';
import { HealthControllerController } from './health-controller/health-controller.controller';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthControllerController, HealthController]
})
export class ControllersModule {}
