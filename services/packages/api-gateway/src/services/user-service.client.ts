import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RedisService } from './redis.service';

export interface UserPreferences {
  email: boolean;
  push: boolean;
  email_enabled?: boolean;
  push_enabled?: boolean;
}

export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  push_token?: string;
  preferences: UserPreferences;
  is_active?: boolean;
  created_at?: string;
}

@Injectable()
export class UserServiceClient {
  private readonly logger = new Logger(UserServiceClient.name);
  private readonly userServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private redisService: RedisService,
  ) {
    this.userServiceUrl = this.configService.get<string>('services.user') || 'http://localhost:3001';
  }

  async getUserById(userId: string): Promise<User> {
    try {
      // Try to get from cache first
      const cachedUser = await this.redisService.get(`user:${userId}`);
      if (cachedUser) {
        this.logger.debug(`User ${userId} retrieved from cache`);
        return cachedUser;
      }

      // If not in cache, fetch from user service
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${userId}`),
      );

      const user = response.data;

      // Cache the user data for 1 hour
      await this.redisService.set(`user:${userId}`, user, 3600);

      return user;
    } catch (error) {
      this.logger.error(`Failed to get user ${userId}`, error);
      throw new HttpException(
        'Failed to fetch user data',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserByEmail(email: string): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/email/${email}`),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user by email ${email}`, error);
      throw new HttpException(
        'Failed to fetch user data',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      // Check cache first
      const cachedPreferences = await this.redisService.getUserPreferences(userId);
      if (cachedPreferences) {
        this.logger.debug(`Preferences for user ${userId} retrieved from cache`);
        return cachedPreferences;
      }

      // Fetch from user service
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${userId}/preferences`),
      );

      const preferences = response.data;

      // Cache preferences
      await this.redisService.cacheUserPreferences(userId, preferences, 3600);

      return preferences;
    } catch (error) {
      this.logger.error(`Failed to get preferences for user ${userId}`, error);
      throw new HttpException(
        'Failed to fetch user preferences',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      this.logger.debug(`Attempting to validate user ${email} at ${this.userServiceUrl}/auth/validate`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/auth/validate`, {
          email,
          password,
        }),
      );

      this.logger.debug(`Successfully validated user ${email}`);
      return response.data;
    } catch (error) {
      // Handle connection errors specifically
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`Connection refused to user service at ${this.userServiceUrl}`);
        throw new HttpException(
          `Unable to connect to user service at ${this.userServiceUrl}. Please ensure the user service is running.`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      if (error.response?.status === 401) {
        return null;
      }

      this.logger.error('Failed to validate user', error);

      // Handle HTTP errors from the service
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'User validation failed';

        throw new HttpException(
          message,
          status,
        );
      }

      // Generic error
      throw new HttpException(
        'Failed to validate user: ' + (error.message || 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkNotificationPermission(
    userId: string,
    notificationType: 'email' | 'push',
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return preferences[notificationType] === true;
    } catch (error) {
      this.logger.error(
        `Failed to check notification permission for user ${userId}`,
        error,
      );
      return false; // Default to not allowing if we can't check
    }
  }

  async createUser(email: string, password: string, fullName: string, pushToken?: string): Promise<User> {
    try {
      this.logger.debug(`Attempting to create user ${email} at ${this.userServiceUrl}/users/create-account`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/users/create-account`, {
          email,
          password,
          full_name: fullName,
          push_token: pushToken,
        }),
      );

      this.logger.debug(`Successfully created user ${email}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create user ${email}`, error);

      // Handle connection errors specifically
      if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          `Unable to connect to user service at ${this.userServiceUrl}. Please ensure the user service is running.`,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      // Handle HTTP errors from the service
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || 'User creation failed';

        throw new HttpException(
          message,
          status,
        );
      }

      // Generic error
      throw new HttpException(
        'Failed to create user: ' + (error.message || 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}