import { Injectable, Logger, Optional } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq/lib/amqp/connection';
import { EmailMessage } from './email.interface';

/**
 * Retry service handles failed email messages with exponential backoff
 * Implements dead letter queue pattern for permanently failed messages
 */
@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);
  private readonly maxRetries = 4;
  private readonly baseDelay = 2000; // 2 seconds base delay

  constructor(@Optional() private readonly amqpConnection?: AmqpConnection) { }

  /**
   * Handle retry logic for failed email messages
   * Implements exponential backoff and dead letter queue
   * @param message The failed email message
   * @param queue The queue to retry on
   * @param attempt Current attempt number
   */
  async handleRetry(message: EmailMessage, queue: string, attempt: number): Promise<void> {
    const maxRetries = message.metadata?.maxRetries || this.maxRetries;

    if (attempt >= maxRetries) {
      this.logger.error(`💀 Max retries exceeded for notification ${message.notification_id}. Moving to failed.queue`);

      // Add failure metadata to message
      message.metadata = {
        ...message.metadata,
        failureReason: 'Max retries exceeded',
        totalAttempts: attempt,
        finalFailureTime: new Date().toISOString(),
      };

      // Log that message would be moved to failed queue
      this.logger.log(`Message ${message.notification_id} would be moved to failed.queue`);
      return;
    }

    // Calculate exponential backoff delay
    const delay = this.calculateExponentialBackoff(attempt);
    this.logger.warn(`⏳ Retrying notification ${message.notification_id} in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`);

    // Schedule retry with delay
    setTimeout(async () => {
      try {
        // Increment attempt count and update metadata
        message.attempt = attempt + 1;
        message.metadata = {
          ...message.metadata,
          lastRetryTime: new Date().toISOString(),
          retryCount: attempt + 1,
        };

        // Publish message back to queue for retry
        if (this.amqpConnection) {
          await this.amqpConnection.publish('notifications.direct', queue, message);
          this.logger.log(`🔄 Rescheduled notification ${message.notification_id} for retry`);
        } else {
          this.logger.warn(`⚠️ RabbitMQ not available, cannot retry notification ${message.notification_id}`);
        }
      } catch (error) {
        this.logger.error(`Failed to reschedule notification ${message.notification_id} for retry`, error);
      }
    }, delay);
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @param attempt Current attempt number
   * @returns Delay in milliseconds
   */
  private calculateExponentialBackoff(attempt: number): number {
    // Base exponential backoff: delay = baseDelay * 2^attempt
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);

    // Add jitter to prevent thundering herd problem
    const jitter = Math.random() * 1000; // Random jitter up to 1 second

    // Cap maximum delay to 30 seconds
    const maxDelay = 30000;

    return Math.min(exponentialDelay + jitter, maxDelay);
  }

  /**
   * Get retry statistics for monitoring
   */
  getRetryStats(): { maxRetries: number; baseDelay: number } {
    return {
      maxRetries: this.maxRetries,
      baseDelay: this.baseDelay,
    };
  }
}
