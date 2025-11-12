import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { EmailModule } from '../email/email.module';

/**
 * Health module for the email service
 * Contains health check endpoints and monitoring
 */
@Module({
  imports: [EmailModule],
  controllers: [HealthController],
})
export class HealthModule {}