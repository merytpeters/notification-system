import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsObject,
  IsEnum,
  IsNotEmpty,
  IsUUID,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
}

export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

export class EmailNotificationDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Welcome to our platform!' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Hello, welcome to our platform...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: { username: 'John' }, required: false })
  @IsObject()
  @IsOptional()
  template_data?: Record<string, any>;

  @ApiProperty({ example: 'welcome_template', required: false })
  @IsString()
  @IsOptional()
  template_id?: string;
}

export class PushNotificationDto {
  @ApiProperty({ example: 'user-device-token-here' })
  @IsString()
  @IsNotEmpty()
  push_token: string;

  @ApiProperty({ example: 'New Message' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'You have a new message from John' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ example: { action: 'open_chat', chat_id: '123' }, required: false })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

export class BulkEmailNotificationDto {
  @ApiProperty({ type: [EmailNotificationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmailNotificationDto)
  notifications: EmailNotificationDto[];
}

export class BulkPushNotificationDto {
  @ApiProperty({ type: [PushNotificationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PushNotificationDto)
  notifications: PushNotificationDto[];
}

export class NotificationStatusDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  notification_id: string;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.DELIVERED })
  @IsEnum(NotificationStatus)
  @IsNotEmpty()
  status: NotificationStatus;

  @ApiProperty({ example: '2025-11-10T12:00:00Z', required: false })
  @IsString()
  @IsOptional()
  timestamp?: string;

  @ApiProperty({ example: 'SMTP connection failed', required: false })
  @IsString()
  @IsOptional()
  error?: string;
}

export class NotificationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  notification_id: string;

  @ApiProperty({ enum: NotificationStatus, example: NotificationStatus.PENDING })
  status: NotificationStatus;

  @ApiProperty({ enum: NotificationType, example: NotificationType.EMAIL })
  type: NotificationType;

  @ApiProperty({ example: '2025-11-10T12:00:00Z' })
  created_at: string;

  @ApiProperty({ example: 'Notification queued successfully' })
  message: string;
}

export class BulkNotificationResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 10 })
  queued: number;

  @ApiProperty({ example: 0 })
  failed: number;

  @ApiProperty({ type: [NotificationResponseDto] })
  notifications: NotificationResponseDto[];
}