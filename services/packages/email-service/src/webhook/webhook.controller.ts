import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { EmailService } from '../email/email.service';

/**
 * Webhook controller for handling external service callbacks
 * Handles delivery confirmations from SendGrid
 */
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly emailService: EmailService) { }

  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  /**
   * Handle SendGrid webhook events for email delivery tracking
   * Processes events like delivered, bounced, opened, clicked, etc.
   * @param events Array of SendGrid webhook events
   * @returns Success response
   */
  async handleSendGridWebhook(@Body() events: any[]): Promise<{ message: string }> {
    this.logger.log(`📧 Received ${events.length} SendGrid webhook events`);

    try {
      // Verify webhook signature (in production, you should verify the signature)
      // const signature = req.headers['x-twilio-email-event-uid'];
      // const timestamp = req.headers['x-twilio-email-event-timestamp'];
      // const signatureValidation = sgWebhook.signature(signature, timestamp, events, process.env.SENDGRID_WEBHOOK_SECRET);

      // Process each event
      await this.emailService.handleDeliveryConfirmation(events);

      this.logger.log(`✅ Successfully processed ${events.length} SendGrid webhook events`);

      return { message: 'Webhook events processed successfully' };
    } catch (error: any) {
      this.logger.error(`❌ Failed to process SendGrid webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('sendgrid/test')
  @HttpCode(HttpStatus.OK)
  /**
   * Test endpoint for SendGrid webhook validation
   * SendGrid sends a test request when setting up webhooks
   * @param testEvent Test event from SendGrid
   * @returns Success response
   */
  async handleSendGridTest(@Body() testEvent: any): Promise<{ message: string }> {
    this.logger.log('🧪 Received SendGrid webhook test event');

    // SendGrid sends a test event when setting up webhooks
    // We should respond with 200 OK to confirm the endpoint is working
    return { message: 'Webhook endpoint is working' };
  }

  @Post('send-email')
  @HttpCode(HttpStatus.OK)
  /**
   * Test endpoint for sending emails directly
   * Used for testing email functionality without RabbitMQ
   * @param emailData Email data to send
   * @returns Success response
   */
  async sendTestEmail(@Body() emailData: {
    to: string;
    templateId?: string;
    variables?: Record<string, any>;
  }): Promise<{ message: string; success: boolean }> {
    this.logger.log(`📧 Sending test email to ${emailData.to}`);

    try {
      await this.emailService.processEmail({
        notification_id: `test-${Date.now()}`,
        to: emailData.to,
        templateId: emailData.templateId || 'welcome',
        variables: emailData.variables || { username: 'Test User', link: 'https://yourapp.com/verify' },
      });

      this.logger.log(`✅ Test email sent successfully to ${emailData.to}`);

      return {
        message: `Test email sent successfully to ${emailData.to}`,
        success: true
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to send test email to ${emailData.to}: ${error.message}`, error.stack);

      return {
        message: `Failed to send test email: ${error.message}`,
        success: false
      };
    }
  }
}