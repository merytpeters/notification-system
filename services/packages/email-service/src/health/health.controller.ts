import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from '../email/email.service';

/**
 * Health check controller for the email service
 * Provides endpoints for monitoring service health
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly emailService: EmailService,
  ) {}

  @Get()
  /**
   * Check overall service health
   * Returns service status and detailed health checks
   */
  async check() {
    const circuitBreakerState = this.emailService.getCircuitBreakerState();
    const isHealthy =
      circuitBreakerState.state !== 'OPEN' &&
      this.checkSendGridConnection();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'email-service',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        sendgrid: {
          status: this.checkSendGridConnection() ? 'healthy' : 'unhealthy',
          message: this.checkSendGridConnection() ? 'SendGrid API key configured' : 'SendGrid API key missing',
        },
        rabbitmq: {
          status: 'healthy', // Mock healthy status for testing
          message: 'RabbitMQ not configured for testing',
        },
        circuitBreaker: {
          status: circuitBreakerState.state === 'OPEN' ? 'unhealthy' : 'healthy',
          state: circuitBreakerState.state,
          failureCount: circuitBreakerState.failureCount,
        },
      },
    };
  }

  @Get('ready')
  /**
   * Check if service is ready to handle requests
   * Used by Kubernetes readiness probe
   */
  async ready() {
    const circuitBreakerState = this.emailService.getCircuitBreakerState();
    
    const isReady =
      circuitBreakerState.state !== 'OPEN' &&
      this.checkSendGridConnection();

    return {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        sendgrid: this.checkSendGridConnection(),
        rabbitmq: true, // Mock ready status for testing
        circuitBreakerOpen: circuitBreakerState.state === 'OPEN',
      },
    };
  }

  @Get('live')
  /**
   * Check if service is alive
   * Used by Kubernetes liveness probe
   */
  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'email-service',
    };
  }

  @Get('circuit-breaker')
  /**
   * Get circuit breaker state
   * Useful for monitoring and debugging
   */
  async circuitBreaker() {
    return this.emailService.getCircuitBreakerState();
  }

  /**
   * Check if SendGrid API key is configured
   */
  private checkSendGridConnection(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }
}