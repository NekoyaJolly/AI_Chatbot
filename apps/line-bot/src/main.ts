// apps/line-bot/src/main.ts
// LINE Bot エントリーポイント

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('LineBot');

  const app = await NestFactory.create(AppModule, {
    // LINE Webhook の生リクエストボディが必要 (シグネチャ検証用)
    rawBody: true,
    logger: ['log', 'error', 'warn'],
  });

  // バリデーション
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger ドキュメント
  const config = new DocumentBuilder()
    .setTitle('LINE Bot API')
    .setDescription('LINE Messaging API Webhook + Management endpoints')
    .setVersion('1.0')
    .addTag('LINE Bot', 'LINE Webhook & management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.LINE_BOT_PORT ?? process.env.PORT ?? 4001;
  await app.listen(port, '0.0.0.0');

  logger.log(`LINE Bot is running on port ${port}`);
  logger.log(`Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
