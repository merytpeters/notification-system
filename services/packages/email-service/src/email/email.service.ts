import { Injectable, Logger, Optional } from '@nestjs/common';
import { TemplateClient } from './template.client';
import { RetryService } from './retry.service';
import { EmailMessage, EmailTemplate, EmailDeliveryStatus, CircuitBreakerState } from './email.interface';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq/lib/amqp/connection';
import SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly senderEmail = process.env.SENDER_EMAIL || 'noreply@notification-system.com';
  private readonly circuitBreaker: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
  };
  private readonly maxFailures = 5;
  private readonly timeoutMs = 60000; // 1 minute
  private readonly processedRequests = new Map<string, boolean>(); // For idempotency

  constructor(
    private readonly templateClient: TemplateClient,
    private readonly retryService: RetryService,
    @Optional() private readonly amqpConnection?: AmqpConnection,
  ) {
    // Initialize SendGrid with API key from environment
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined in environment variables');
    }
    SendGrid.setApiKey(apiKey);
    this.logger.log('EmailService initialized with SendGrid');
  }

  /**
   * Process an email message with circuit breaker and idempotency handling
   */
  async processEmail(message: EmailMessage): Promise<void> {
    const { notification_id, to, templateId, variables, attempt = 0, request_id } = message;

    // Check for idempotency - skip if already processed
    if (request_id && this.processedRequests.has(request_id)) {
      this.logger.log(`Request ${request_id} already processed, skipping`);
      return;
    }

    // Check circuit breaker state
    if (this.isCircuitOpen()) {
      const error = 'Circuit breaker is OPEN - email service temporarily unavailable';
      this.logger.error(error);
      await this.retryService.handleRetry(message, 'email.queue', attempt);
      return;
    }

    try {
      // 1️⃣ Fetch the email template from template service
      const template: EmailTemplate = await this.templateClient.getTemplate(templateId);

      // 2️⃣ Render template variables (e.g., {{name}}, {{link}})
      const html = this.renderTemplate(template.content, variables);
      const textContent = template.textContent ? this.renderTemplate(template.textContent, variables) : undefined;

      // 3️⃣ Send email using SendGrid
      await this.sendEmailViaSendGrid(to, template.subject, html, textContent, notification_id);

      // Mark request as processed for idempotency
      if (request_id) {
        this.processedRequests.set(request_id, true);
        
        // Clean up old entries after 24 hours
        setTimeout(() => {
          this.processedRequests.delete(request_id);
        }, 24 * 60 * 60 * 1000);
      }

      // Reset circuit breaker on success
      this.resetCircuitBreaker();
      
      this.logger.log(`✅ Email sent successfully to ${to} with notification ID: ${notification_id}`);
    } catch (error: any) {
      this.logger.error(`⚠️ Email failed (Attempt ${attempt}): ${error.message}`);
      
      // Update circuit breaker state on failure
      this.recordFailure();
      
      // Handle retry logic
      await this.retryService.handleRetry(message, 'email.queue', attempt);
    }
  }

  /**
   * Send email using SendGrid API
   */
  private async sendEmailViaSendGrid(
    to: string,
    subject: string,
    html: string,
    textContent?: string,
    notificationId?: string,
  ): Promise<void> {
    const msg: SendGrid.MailDataRequired = {
      to,
      from: this.senderEmail,
      subject,
      html,
      ...(textContent && { text: textContent }),
      ...(notificationId && {
        customArgs: {
          notification_id: notificationId,
        },
      }),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
        subscriptionTracking: { enable: false },
      },
    };

    const [response] = await SendGrid.send(msg);
    
    // Check if the email was accepted by SendGrid
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`SendGrid API returned status code: ${response.statusCode}`);
    }
  }

  /**
   * Handle delivery confirmation webhook from SendGrid
   */
  async handleDeliveryConfirmation(webhookData: any[]): Promise<void> {
    for (const event of webhookData) {
      const notificationId = event.notification_id || event.customArgs?.notification_id;
      
      if (!notificationId) {
        this.logger.warn('Received webhook event without notification_id');
        continue;
      }

      const status: EmailDeliveryStatus = {
        notification_id: notificationId,
        status: this.mapSendGridEventToStatus(event.event),
        timestamp: event.timestamp || new Date().toISOString(),
        error: event.reason ? `${event.event}: ${event.reason}` : undefined,
        provider_response: event,
      };

      // Publish status update to RabbitMQ
      await this.publishStatusUpdate(status);
      
      this.logger.log(`Delivery status updated for ${notificationId}: ${status.status}`);
    }
  }

  /**
   * Map SendGrid webhook events to our status enum
   */
  private mapSendGridEventToStatus(event: string): 'delivered' | 'pending' | 'failed' | 'bounced' {
    switch (event) {
      case 'delivered':
        return 'delivered';
      case 'processed':
      case 'open':
      case 'click':
        return 'pending';
      case 'bounce':
      case 'blocked':
      case 'spamreport':
        return 'bounced';
      case 'dropped':
      case 'deferred':
      default:
        return 'failed';
    }
  }

  /**
   * Publish status update to RabbitMQ
   */
  private async publishStatusUpdate(status: EmailDeliveryStatus): Promise<void> {
    if (this.amqpConnection) {
      try {
        await this.amqpConnection.publish('notifications.direct', 'status', status);
        this.logger.log(`Status update published to RabbitMQ: ${status.notification_id} - ${status.status}`);
      } catch (error) {
        this.logger.error(`Failed to publish status update to RabbitMQ: ${error.message}`, error);
      }
    } else {
      // Fallback to logging if RabbitMQ is not available
      this.logger.log(`Status update (RabbitMQ unavailable): ${JSON.stringify(status)}`);
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(content: string, vars: Record<string, any>): string {
    return content.replace(
      /\{\{(.*?)\}\}/g,
      (_, key) => vars[key.trim()] || '',
    );
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'OPEN') {
      const timeSinceOpen = Date.now() - (this.circuitBreaker.lastFailureTime || 0);
      if (timeSinceOpen > this.timeoutMs) {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.circuitBreaker.successCount = 0;
        this.logger.log('Circuit breaker transitioning to HALF_OPEN state');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record a failure for circuit breaker
   */
  private recordFailure(): void {
    this.circuitBreaker.failureCount++;
    
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.lastFailureTime = Date.now();
      this.logger.error('Circuit breaker opened due to failure in HALF_OPEN state');
    } else if (this.circuitBreaker.failureCount >= this.maxFailures) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.lastFailureTime = Date.now();
      this.logger.error(`Circuit breaker opened after ${this.maxFailures} consecutive failures`);
    }
  }

  /**
   * Reset circuit breaker on success
   */
  private resetCircuitBreaker(): void {
    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount = (this.circuitBreaker.successCount || 0) + 1;
      if (this.circuitBreaker.successCount >= 3) { // Require 3 successes to close
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failureCount = 0;
        this.logger.log('Circuit breaker closed after successful recovery');
      }
    } else {
      this.circuitBreaker.failureCount = 0;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }
}

// import { Injectable } from '@nestjs/common';
// import SendGrid from '@sendgrid/mail';
// import { TemplateClient } from './template.client';
// import { RetryService } from './retry.service';

// @Injectable()
// export class EmailService {
//   constructor(
//     private readonly templateClient: TemplateClient,
//     private readonly retryService: RetryService,
//   ) {
//     const apiKey = process.env.SENDGRID_API_KEY;
//     if (!apiKey) throw new Error('SENDGRID_API_KEY is not defined!');

//     SendGrid.setApiKey(apiKey);
//   }

//   async processEmail(message: any) {
//     const { to, templateId, variables, attempt = 0 } = message;
//     try {
//       // 1️⃣ Get your template (HTML file or DB content)
//       const template = await this.templateClient.getTemplate(templateId);

//       // 2️⃣ Replace variables (like {{name}}, {{link}}) in your HTML
//       const html = this.renderTemplate(template.content, variables);

//       // 3️⃣ Send it through SendGrid (HTML only, no templateId)
//       await SendGrid.send({
//         to,
//         from: 'williamseneojo@gmail.com', // verified sender
//         subject: template.subject,
//         html, // 👈 your rendered HTML
//       });

//       console.log(`✅ Email sent successfully to ${to}`);
//     } catch (error: any) {
//       console.error(`⚠️ Email failed (Attempt ${attempt}): ${error.message}`);
//       await this.retryService.handleRetry(message, 'email.queue', attempt);
//     }
//   }

//   private renderTemplate(content: string, vars: Record<string, any>): string {
//     return content.replace(
//       /\{\{(.*?)\}\}/g,
//       (_, key) => vars[key.trim()] || '',
//     );
//   }
// }
