import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const apiPrefix = configService.get<string>('api.prefix');

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global API prefix
  app.setGlobalPrefix(`${apiPrefix}`);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Notification System API Gateway')
    .setDescription(
      'API Gateway for distributed notification system with email and push notifications',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(`${port}`);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}${apiPrefix}`,
  );
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}${apiPrefix}/gateway-health`);
}
bootstrap();
