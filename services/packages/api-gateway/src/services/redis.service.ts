import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const redisUrl = this.configService.get<string>('redis.url');
      const redisHost = this.configService.get<string>('redis.host') || 'localhost';
      const redisPort = this.configService.get<number>('redis.port') || 6379;
      const redisPassword = this.configService.get<string>('redis.password');

      if (redisUrl) {
        this.client = new Redis(redisUrl);
      } else {
        this.client = new Redis({
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });
      }

      this.client.on('connect', () => {
        this.logger.log('Successfully connected to Redis');
      });

      this.client.on('error', (err) => {
        this.logger.error('Redis connection error', err);
      });

      await this.client.ping();
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  // Cache user preferences
  async cacheUserPreferences(userId: string, preferences: any, ttl = 3600): Promise<void> {
    try {
      const key = `user:${userId}:preferences`;
      await this.client.setex(key, ttl, JSON.stringify(preferences));
      this.logger.debug(`Cached user preferences for user: ${userId}`);
    } catch (error) {
      this.logger.error('Failed to cache user preferences', error);
    }
  }

  async getUserPreferences(userId: string): Promise<any | null> {
    try {
      const key = `user:${userId}:preferences`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get user preferences', error);
      return null;
    }
  }

  // Notification status tracking
  async setNotificationStatus(
    notificationId: string,
    status: string,
    ttl = 604800, // 7 days
  ): Promise<void> {
    try {
      const key = `notification:${notificationId}:status`;
      await this.client.setex(key, ttl, status);
    } catch (error) {
      this.logger.error('Failed to set notification status', error);
    }
  }

  async getNotificationStatus(notificationId: string): Promise<string | null> {
    try {
      const key = `notification:${notificationId}:status`;
      return await this.client.get(key);
    } catch (error) {
      this.logger.error('Failed to get notification status', error);
      return null;
    }
  }

  // Store notification metadata
  async storeNotificationMetadata(
    notificationId: string,
    metadata: any,
    ttl = 604800,
  ): Promise<void> {
    try {
      const key = `notification:${notificationId}:metadata`;
      await this.client.setex(key, ttl, JSON.stringify(metadata));
    } catch (error) {
      this.logger.error('Failed to store notification metadata', error);
    }
  }

  async getNotificationMetadata(notificationId: string): Promise<any | null> {
    try {
      const key = `notification:${notificationId}:metadata`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error('Failed to get notification metadata', error);
      return null;
    }
  }

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, window);
      }

      return current <= limit;
    } catch (error) {
      this.logger.error('Failed to check rate limit', error);
      return true; // Allow on error to not block legitimate requests
    }
  }

  async getRateLimitInfo(key: string): Promise<{ current: number; ttl: number }> {
    try {
      const current = await this.client.get(key);
      const ttl = await this.client.ttl(key);
      return {
        current: current ? parseInt(current, 10) : 0,
        ttl: ttl > 0 ? ttl : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get rate limit info', error);
      return { current: 0, ttl: 0 };
    }
  }

  // Generic cache methods
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Failed to set key: ${key}`, error);
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get key: ${key}`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key: ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key: ${key}`, error);
      return false;
    }
  }

  private async disconnect() {
    try {
      await this.client.quit();
      this.logger.log('Disconnected from Redis');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', error);
    }
  }

  isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  getClient(): Redis {
    return this.client;
  }
}