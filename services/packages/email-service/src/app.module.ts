import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';

/**
 * Main application module for the email service
 * Configures global settings and imports feature modules
 */
@Module({
  // allows the config module to be accessible globally
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    HealthModule,
    WebhookModule,
  ],
})
export class AppModule { }
