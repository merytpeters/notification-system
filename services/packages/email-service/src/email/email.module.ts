import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { TemplateClient } from './template.client';
import { RetryService } from './retry.service';
import { EmailConsumer } from './email.consumer';
import { HttpModule } from '@nestjs/axios';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.module';
import { ConfigurableModuleClass } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq-module-definition';

// Create a module that extends ConfigurableModuleClass to get forRootAsync
class RabbitMQModuleWithConfig extends ConfigurableModuleClass {}

/**
 * Email module handles email processing functionality
 * Configures HTTP services and all email-related components
 */
@Module({
  imports: [
    HttpModule,
    // Only configure RabbitMQ if URI is provided and not in test mode
    ...(process.env.RABBITMQ_URI && process.env.NODE_ENV !== 'test' ? [
      RabbitMQModuleWithConfig.forRootAsync({
        useFactory: () => ({
          exchanges: [
            {
              name: 'notifications.direct',
              type: 'direct',
            },
          ],
          uri: process.env.RABBITMQ_URI || 'amqp://localhost:5672',
          connectionInitOptions: { timeout: 30000 },
          defaultRpcTimeout: 30000,
          defaultExchangeType: 'direct',
        }),
      }),
    ] : []),
  ],
  providers: [
    EmailService,
    TemplateClient,
    RetryService,
    EmailConsumer,
  ],
  exports: [
    EmailService,
    TemplateClient,
    RetryService,
  ],
})
export class EmailModule { }
