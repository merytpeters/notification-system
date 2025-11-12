import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import { CurrentUser } from '../decorators/user.decorator';
import {
  EmailNotificationDto,
  PushNotificationDto,
  NotificationResponseDto,
  BulkEmailNotificationDto,
  BulkPushNotificationDto,
  BulkNotificationResponseDto,
  NotificationStatusDto,
} from '../dto/notification.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationService: NotificationService) {}

  @Post('email')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send an email notification' })
  @ApiResponse({
    status: 202,
    description: 'Email notification queued',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendEmail(
    @Body() emailDto: EmailNotificationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.sendEmailNotification(emailDto, userId);
  }

  @Post('push')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a push notification' })
  @ApiResponse({
    status: 202,
    description: 'Push notification queued',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendPush(
    @Body() pushDto: PushNotificationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.sendPushNotification(pushDto, userId);
  }

  @Post('email/bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send bulk email notifications' })
  @ApiResponse({
    status: 202,
    description: 'Bulk email notifications queued',
    type: BulkNotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendBulkEmail(
    @Body() bulkDto: BulkEmailNotificationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<BulkNotificationResponseDto> {
    return this.notificationService.sendBulkEmailNotifications(bulkDto, userId);
  }

  @Post('push/bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send bulk push notifications' })
  @ApiResponse({
    status: 202,
    description: 'Bulk push notifications queued',
    type: BulkNotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendBulkPush(
    @Body() bulkDto: BulkPushNotificationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<BulkNotificationResponseDto> {
    return this.notificationService.sendBulkPushNotifications(bulkDto, userId);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get notification status' })
  @ApiParam({ name: 'id', description: 'Notification ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Notification status retrieved',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatus(@Param('id') id: string): Promise<any> {
    return this.notificationService.getNotificationStatus(id);
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update notification status (used by worker services)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
  })
  async updateStatus(@Body() statusDto: NotificationStatusDto): Promise<any> {
    await this.notificationService.updateNotificationStatus(
      statusDto.notification_id,
      statusDto.status,
      statusDto.error,
    );

    return {
      message: 'Status updated successfully',
      notification_id: statusDto.notification_id,
      status: statusDto.status,
    };
  }

  @Post('send')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send a push notification' })
  @ApiResponse({
    status: 202,
    description: 'Push notification queued',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendNotification(
    @Body() pushDto: PushNotificationDto,
    @CurrentUser('userId') userId: string,
  ): Promise<NotificationResponseDto> {
    return this.notificationService.sendPushNotification(pushDto, userId);
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get notification status by idempotency key' })
  @ApiParam({ name: 'idempotency_key', description: 'Idempotency key for the notification' })
  @ApiResponse({
    status: 200,
    description: 'Notification status retrieved',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStatusByIdempotencyKey(
    @Query('idempotency_key') idempotencyKey: string,
  ): Promise<any> {
    return this.notificationService.getNotificationStatusByIdempotencyKey(idempotencyKey);
  }
}