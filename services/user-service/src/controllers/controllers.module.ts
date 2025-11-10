import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { AppService } from 'src/app.service';

@Module({
  controllers: [HealthController],
  providers: [AppService]
})
export class ControllersModule { }
