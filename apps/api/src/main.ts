// apps/api/src/main.ts
// W1-007: NestJS 10 プロジェクト初期化

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // グローバルバリデーション
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API プレフィックス
  app.setGlobalPrefix('api/v1');

  // Swagger 設定
  const config = new DocumentBuilder()
    .setTitle('AI Chatbot SaaS API')
    .setDescription('AI Chatbot SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'ヘルスチェック')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`✅ NestJS API running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}

bootstrap();
