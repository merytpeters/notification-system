import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { swaggerUi } from 'swagger-ui-express';

/**
 * Bootstrap the email service application
 * Configures HTTP server and microservice capabilities
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug'],
    });

    // Enable CORS for webhook endpoints
    app.enableCors({
      origin: ['*'], // In production, restrict to specific origins
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Set global prefix
    app.setGlobalPrefix('api/v1');

    // Configure Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Email Service API')
      .setDescription('Email service for sending notifications and handling webhooks')
      .setVersion('1.0.0')
      .addTag('webhooks', 'Webhook endpoints for external services')
      .addTag('health', 'Health check endpoints')
      .addTag('email', 'Email sending endpoints')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);


    // Get port from environment
    const port = process.env.PORT || 3002;

    await app.listen(port);

    logger.log(`🚀 Email Service is running on port ${port}`);
    logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
    logger.log(`📊 Health check available at http://localhost:${port}/api/v1/health`);
    logger.log(`🔗 Webhook endpoint available at http://localhost:${port}/api/v1/webhook/sendgrid`);

  } catch (error) {
    logger.error('Failed to start Email Service', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  const logger = new Logger('Bootstrap');
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  const logger = new Logger('Bootstrap');
  logger.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  const logger = new Logger('Bootstrap');
  logger.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

void bootstrap();
