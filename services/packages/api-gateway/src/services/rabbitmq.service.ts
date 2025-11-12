import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

/**
 * Interface for queue messages in the notification system
 */
export interface QueueMessage {
  /** Unique identifier for the notification */
  notification_id: string;
  /** Type of notification */
  type: 'email' | 'push';
  /** Notification data payload */
  data: any;
  /** User ID associated with the notification */
  user_id?: string;
  /** Timestamp when the notification was created */
  timestamp: string;
  /** Current retry count */
  retry_count?: number;
}

/**
 * RabbitMQ service handles message queue operations
 * Publishes notifications to appropriate queues and manages connections
 */
@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly exchangeName = 'notifications.direct';
  private readonly queues: {
    email: string;
    push: string;
    status: string;
  };

  constructor(private configService: ConfigService) {
    // Initialize queue names with configuration values and defaults
    this.queues = {
      email: 'email.queue',
      push: 'push.queue',
      status: 'status.queue',
    };
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Establish connection to RabbitMQ and configure exchanges/queues
   */
  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get<string>('rabbitmq.url');
      
      if (!rabbitmqUrl) {
        throw new Error('RabbitMQ URL is not configured');
      }
      
      this.connection = amqp.connect([rabbitmqUrl], {
        heartbeatIntervalInSeconds: 30,
        reconnectTimeInSeconds: 5,
      });

      this.connection.on('connect', () => {
        this.logger.log('Successfully connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('Disconnected from RabbitMQ', err);
      });

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          // Declare the direct exchange
          await channel.assertExchange(this.exchangeName, 'direct', {
            durable: true,
          });

          // Declare the email queue
          await channel.assertQueue(this.queues.email, {
            durable: true,
            arguments: {
              'x-message-ttl': 86400000, // 24 hours
              'x-max-length': 10000,
              'x-dead-letter-exchange': this.exchangeName,
              'x-dead-letter-routing-key': 'failed',
            },
          });

          // Bind email queue to exchange
          await channel.bindQueue(this.queues.email, this.exchangeName, 'email');

          // Declare the push queue
          await channel.assertQueue(this.queues.push, {
            durable: true,
            arguments: {
              'x-message-ttl': 86400000,
              'x-max-length': 10000,
              'x-dead-letter-exchange': this.exchangeName,
              'x-dead-letter-routing-key': 'failed',
            },
          });

          // Bind push queue to exchange
          await channel.bindQueue(this.queues.push, this.exchangeName, 'push');

          // Declare the failed queue (dead letter queue)
          await channel.assertQueue('failed.queue', {
            durable: true,
            arguments: {
              'x-message-ttl': 604800000, // 7 days
              'x-max-length': 50000,
            },
          });

          // Bind failed queue to exchange
          await channel.bindQueue('failed.queue', this.exchangeName, 'failed');

          // Declare the status queue
          await channel.assertQueue(this.queues.status, {
            durable: true,
            arguments: {
              'x-message-ttl': 604800000, // 7 days
              'x-max-length': 50000,
            },
          });

          // Bind status queue to exchange
          await channel.bindQueue(this.queues.status, this.exchangeName, 'status');

          this.logger.log('RabbitMQ exchanges and queues declared successfully');
        },
      });

      await this.channelWrapper.waitForConnect();
      this.logger.log('RabbitMQ channel ready');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  /**
   * Publish message to exchange with routing key
   * @param routingKey Routing key for message routing
   * @param message Message to publish
   * @returns Promise that resolves when message is published
   */
  async publishToExchange(routingKey: string, message: QueueMessage): Promise<boolean> {
    try {
      // Publish message to exchange with routing key
      await this.channelWrapper.publish(this.exchangeName, routingKey, message);

      this.logger.debug(`Message published to exchange: ${this.exchangeName} with routing key: ${routingKey}`, {
        notification_id: message.notification_id,
        type: message.type,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to publish message to exchange: ${this.exchangeName} with routing key: ${routingKey}`, error);
      throw error;
    }
  }

  /**
   * Publish email notification to email queue via exchange
   * @param message Email notification message
   * @returns Promise that resolves when message is published
   */
  async publishEmailNotification(message: QueueMessage): Promise<boolean> {
    return this.publishToExchange('email', message);
  }

  /**
   * Publish push notification to push queue via exchange
   * @param message Push notification message
   * @returns Promise that resolves when message is published
   */
  async publishPushNotification(message: QueueMessage): Promise<boolean> {
    return this.publishToExchange('push', message);
  }

  /**
   * Publish status update to status queue via exchange
   * @param message Status update message
   * @returns Promise that resolves when message is published
   */
  async publishStatusUpdate(message: any): Promise<boolean> {
    return this.publishToExchange('status', message);
  }

  /**
   * Consume messages from status queue for tracking
   * @param callback Callback function to process messages
   * @returns Promise that resolves when consumer is set up
   */
  async consumeStatusQueue(
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    try {
      await this.channelWrapper.addSetup((channel: ConfirmChannel) => {
        return channel.consume(
          this.queues.status,
          async (msg) => {
            if (msg) {
              try {
                const content = JSON.parse(msg.content.toString());
                await callback(content);
                channel.ack(msg);
              } catch (error) {
                this.logger.error('Error processing status message', error);
                channel.nack(msg, false, false); // Don't requeue on error
              }
            }
          },
          { noAck: false },
        );
      });

      this.logger.log('Started consuming status queue');
    } catch (error) {
      this.logger.error('Failed to consume status queue', error);
      throw error;
    }
  }

  /**
   * Get statistics for a specific queue
   * @param queueName Name of the queue
   * @returns Queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    try {
      return await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
        return channel.checkQueue(queueName);
      });
    } catch (error) {
      this.logger.error(`Failed to get queue stats for: ${queueName}`, error);
      return null;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  private async disconnect() {
    try {
      await this.channelWrapper.close();
      await this.connection.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  /**
   * Check if RabbitMQ connection is active
   * @returns Connection status
   */
  isConnected(): boolean {
    return this.connection?.isConnected() || false;
  }
}