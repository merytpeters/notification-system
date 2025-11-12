import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { EmailModule } from '../email/email.module';

/**
 * Webhook module for handling external service callbacks
 * Handles delivery confirmations and other webhook events
 */
@Module({
  imports: [EmailModule],
  controllers: [WebhookController],
})
export class WebhookModule {}