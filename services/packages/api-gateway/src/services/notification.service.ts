import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { RabbitMQService, QueueMessage } from './rabbitmq.service';
import { RedisService } from './redis.service';
import { UserServiceClient } from './user-service.client';
import {
  EmailNotificationDto,
  PushNotificationDto,
  NotificationResponseDto,
  NotificationStatus,
  NotificationType,
  BulkEmailNotificationDto,
  BulkPushNotificationDto,
  BulkNotificationResponseDto,
} from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private rabbitmqService: RabbitMQService,
    private redisService: RedisService,
    private userServiceClient: UserServiceClient,
  ) {}

  async sendEmailNotification(
    emailDto: EmailNotificationDto,
    userId?: string,
  ): Promise<NotificationResponseDto> {
    try {
      // Check user preferences if userId is provided
      if (userId) {
        const hasPermission = await this.userServiceClient.checkNotificationPermission(
          userId,
          'email',
        );

        if (!hasPermission) {
          throw new BadRequestException('User has disabled email notifications');
        }
      }

      const notificationId = uuidv4();
      const timestamp = new Date().toISOString();

      // Create queue message for tracking
      const queueMessage: QueueMessage = {
        notification_id: notificationId,
        type: 'email',
        data: {
          ...emailDto,
          // Add email service specific fields
          to: emailDto.email,
          templateId: emailDto.template_id || 'default',
          variables: {
            ...emailDto.template_data,
            subject: emailDto.subject,
            body: emailDto.body,
          },
          request_id: notificationId, // Use notification_id as request_id for idempotency
          user_id: userId,
          priority: 1, // Default priority
          metadata: {
            source: 'api-gateway',
            created_at: timestamp,
          },
        },
        user_id: userId,
        timestamp,
        retry_count: 0,
      };

      // Publish to RabbitMQ
      await this.rabbitmqService.publishEmailNotification(queueMessage);

      // Store initial status in Redis
      await this.redisService.setNotificationStatus(
        notificationId,
        NotificationStatus.PENDING,
      );

      // Store notification metadata
      await this.redisService.storeNotificationMetadata(notificationId, {
        type: NotificationType.EMAIL,
        user_id: userId,
        email: emailDto.email,
        subject: emailDto.subject,
        created_at: timestamp,
      });

      this.logger.log(`Email notification queued: ${notificationId}`);

      return {
        notification_id: notificationId,
        status: NotificationStatus.PENDING,
        type: NotificationType.EMAIL,
        created_at: timestamp,
        message: 'Email notification queued successfully',
      };
    } catch (error) {
      this.logger.error('Failed to send email notification', error);
      throw error;
    }
  }

  async sendPushNotification(
    pushDto: PushNotificationDto,
    userId?: string,
  ): Promise<NotificationResponseDto> {
    try {
      // Handle idempotency key
      if (pushDto.idempotency_key) {
        const existingStatus = await this.redisService.getNotificationStatusByIdempotencyKey(pushDto.idempotency_key);
        if (existingStatus) {
          const existingMetadata = await this.redisService.getNotificationMetadataByIdempotencyKey(pushDto.idempotency_key);
          if (existingMetadata) {
            return {
              notification_id: existingMetadata.notification_id,
              status: existingStatus as NotificationStatus,
              type: NotificationType.PUSH,
              created_at: existingMetadata.created_at,
              message: 'Notification already processed (idempotent request)',
            };
          }
        }
      }

      // Check user preferences if userId is provided
      const targetUserId = userId || pushDto.user_id;
      if (targetUserId) {
        const hasPermission = await this.userServiceClient.checkNotificationPermission(
          targetUserId,
          'push',
        );

        if (!hasPermission) {
          throw new BadRequestException('User has disabled push notifications');
        }
      }

      const notificationId = uuidv4();
      const timestamp = new Date().toISOString();

      const message: QueueMessage = {
        notification_id: notificationId,
        type: 'push',
        data: {
          ...pushDto,
          // Add additional fields for push service
          token: pushDto.token,
          notification_type: pushDto.notification_type,
          image: pushDto.image,
          link: pushDto.link,
          variables: pushDto.data || {},
          request_id: pushDto.idempotency_key || notificationId,
          user_id: targetUserId,
          priority: 1, // Default priority
          metadata: {
            source: 'api-gateway',
            created_at: timestamp,
            idempotency_key: pushDto.idempotency_key,
          },
        },
        user_id: targetUserId,
        timestamp,
        retry_count: 0,
      };

      // Publish to RabbitMQ
      await this.rabbitmqService.publishPushNotification(message);

      // Store initial status in Redis
      await this.redisService.setNotificationStatus(
        notificationId,
        NotificationStatus.PENDING,
      );

      // Store idempotency mapping if provided
      if (pushDto.idempotency_key) {
        await this.redisService.setIdempotencyMapping(
          pushDto.idempotency_key,
          notificationId,
          timestamp,
        );
      }

      // Store notification metadata
      await this.redisService.storeNotificationMetadata(notificationId, {
        type: NotificationType.PUSH,
        user_id: userId || pushDto.user_id,
        push_token: pushDto.token,
        title: pushDto.title,
        created_at: timestamp,
        idempotency_key: pushDto.idempotency_key,
        notification_type: pushDto.notification_type,
        image: pushDto.image,
        link: pushDto.link,
      });

      this.logger.log(`Push notification queued: ${notificationId}`);

      return {
        notification_id: notificationId,
        status: NotificationStatus.PENDING,
        type: NotificationType.PUSH,
        created_at: timestamp,
        message: 'Push notification queued successfully',
      };
    } catch (error) {
      this.logger.error('Failed to send push notification', error);
      throw error;
    }
  }

  async sendBulkEmailNotifications(
    bulkDto: BulkEmailNotificationDto,
    userId?: string,
  ): Promise<BulkNotificationResponseDto> {
    const results: NotificationResponseDto[] = [];
    let queued = 0;
    let failed = 0;

    for (const notification of bulkDto.notifications) {
      try {
        const result = await this.sendEmailNotification(notification, userId);
        results.push(result);
        queued++;
      } catch (error) {
        this.logger.error('Failed to queue bulk email notification', error);
        failed++;
      }
    }

    return {
      total: bulkDto.notifications.length,
      queued,
      failed,
      notifications: results,
    };
  }

  async sendBulkPushNotifications(
    bulkDto: BulkPushNotificationDto,
    userId?: string,
  ): Promise<BulkNotificationResponseDto> {
    const results: NotificationResponseDto[] = [];
    let queued = 0;
    let failed = 0;

    for (const notification of bulkDto.notifications) {
      try {
        const result = await this.sendPushNotification(notification, userId);
        results.push(result);
        queued++;
      } catch (error) {
        this.logger.error('Failed to queue bulk push notification', error);
        failed++;
      }
    }

    return {
      total: bulkDto.notifications.length,
      queued,
      failed,
      notifications: results,
    };
  }

  async getNotificationStatus(notificationId: string): Promise<any> {
    try {
      const status = await this.redisService.getNotificationStatus(notificationId);
      const metadata = await this.redisService.getNotificationMetadata(notificationId);

      if (!status || !metadata) {
        throw new BadRequestException('Notification not found');
      }

      return {
        notification_id: notificationId,
        status,
        ...metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get notification status: ${notificationId}`, error);
      throw error;
    }
  }

  async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    error?: string,
  ): Promise<void> {
    try {
      await this.redisService.setNotificationStatus(notificationId, status);

      if (error) {
        const metadata = await this.redisService.getNotificationMetadata(notificationId);
        if (metadata) {
          metadata.error = error;
          metadata.updated_at = new Date().toISOString();
          await this.redisService.storeNotificationMetadata(notificationId, metadata);
        }
      }

      this.logger.log(`Notification ${notificationId} status updated to ${status}`);
    } catch (err) {
      this.logger.error(`Failed to update notification status: ${notificationId}`, err);
    }
  }

  async getNotificationStatusByIdempotencyKey(idempotencyKey: string): Promise<any> {
    try {
      const status = await this.redisService.getNotificationStatusByIdempotencyKey(idempotencyKey);
      const metadata = await this.redisService.getNotificationMetadataByIdempotencyKey(idempotencyKey);

      if (!status || !metadata) {
        throw new BadRequestException('Notification not found');
      }

      return {
        notification_id: metadata.notification_id,
        status,
        ...metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get notification status by idempotency key: ${idempotencyKey}`, error);
      throw error;
    }
  }
}