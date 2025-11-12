import { Injectable, Logger, Optional } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq/lib/amqp/connection';

// Import interfaces and services
import { EmailMessage, EmailDeliveryStatus } from './email.interface';
import { EmailService } from './email.service';

/**
 * EmailConsumer handles messages from the email queue in RabbitMQ
 * It processes email notifications by delegating to EmailService
 */
@Injectable()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(
    private readonly emailService: EmailService,
    @Optional() private readonly amqpConnection?: AmqpConnection,
  ) {}

  /**
   * Subscribe to email queue and process messages
   * Uses the notifications.direct exchange with routing key 'email'
   */
  async onModuleInit() {
    if (this.amqpConnection) {
      await this.amqpConnection.createSubscriber(
        async (msg: EmailMessage) => {
          await this.handleEmail(msg);
        },
        {
          exchange: 'notifications.direct',
          routingKey: 'email',
          queue: 'email.queue',
          queueOptions: {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'notifications.direct',
              'x-dead-letter-routing-key': 'failed',
            },
          },
        },
        'email-subscriber', // Subscriber name
      );

      this.logger.log('EmailConsumer subscribed to email.queue');
    } else {
      this.logger.warn('⚠️ RabbitMQ not available, EmailConsumer will not subscribe to queues');
    }
  }

  /**
   * Process incoming email messages from the queue
   * @param msg Email message from RabbitMQ queue
   */
  async handleEmail(msg: any): Promise<void> {
    // Extract email data from the message format sent by API gateway
    const emailData = msg.data || msg;
    
    // Create EmailMessage object in the expected format
    const emailMessage: EmailMessage = {
      notification_id: msg.notification_id,
      to: emailData.to,
      templateId: emailData.templateId,
      variables: emailData.variables || {},
      attempt: msg.retry_count || 0,
      request_id: emailData.request_id,
      user_id: msg.user_id,
      priority: emailData.priority,
      metadata: emailData.metadata,
    };

    this.logger.log(`📩 Received message from email.queue: ${JSON.stringify({
      notification_id: emailMessage.notification_id,
      to: emailMessage.to,
      templateId: emailMessage.templateId,
      attempt: emailMessage.attempt,
    })}`);

    try {
      // Validate required fields
      if (!emailMessage.notification_id || !emailMessage.to || !emailMessage.templateId) {
        throw new Error('Missing required fields: notification_id, to, or templateId');
      }

      // Process the email using EmailService
      await this.emailService.processEmail(emailMessage);

      this.logger.log(`✅ Successfully processed email: ${emailMessage.notification_id}`);
    } catch (error: any) {
      this.logger.error(`❌ Failed to process email ${emailMessage.notification_id}: ${error.message}`, error.stack);

      // For critical errors, we let RabbitMQ handle the retry/reject logic
      // The EmailService already handles retry logic for transient failures
      throw error;
    }
  }

  /**
   * Handle delivery confirmation webhooks from SendGrid
   * This endpoint would be called by SendGrid when email events occur
   */
  async handleDeliveryConfirmation(events: any[]): Promise<void> {
    this.logger.log(`📧 Received ${events.length} delivery confirmation events`);

    try {
      await this.emailService.handleDeliveryConfirmation(events);
      this.logger.log('✅ Delivery confirmations processed successfully');
    } catch (error: any) {
      this.logger.error(`❌ Failed to process delivery confirmations: ${error.message}`, error.stack);
      throw error;
    }
  }
}
