// apps/api/src/main.ts
// W1-007: NestJS 10 プロジェクト初期化
// W4-008/009: セキュリティ強化 (Helmet, CORS whitelist, Rate limit)

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // CORS は後で手動設定するため初期化時は無効
    cors: false,
    rawBody: true, // LINE webhook用
    logger: ['log', 'error', 'warn', 'debug'],
  });

  // ─── W4-009: Helmet セキュリティヘッダー ────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // Swagger UI のため
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // ─── W4-009: CORS ホワイトリスト ─────────────────────────────────────────────
  const allowedOrigins = [
    process.env.FRONTEND_URL ?? 'http://localhost:3000',
    process.env.WIDGET_ORIGIN ?? '*',             // ウィジェット (任意ドメインから許可)
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:4001',                        // LINE Bot
  ].filter(Boolean);

  // Vercel デプロイURL パターン許可
  const vercelPatterns = [/^https:\/\/.*\.vercel\.app$/, /^https:\/\/.*\.run\.app$/];

  app.enableCors({
    origin: (origin, callback) => {
      // オリジンなし (Postman、サーバー間通信) は許可
      if (!origin) return callback(null, true);
      // ホワイトリストチェック
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Vercel / Cloud Run パターンチェック
      if (vercelPatterns.some((p) => p.test(origin))) return callback(null, true);
      // その他は拒否
      logger.warn(`CORS rejected: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-internal-secret',
      'x-line-signature',
      'x-admin-secret',
    ],
    credentials: true,
    maxAge: 86400, // Preflight キャッシュ 24h
  });

  // ─── グローバルバリデーション ─────────────────────────────────────────────────
  // W4-010: SQL injection / XSS → class-validator の whitelist + forbidNonWhitelisted で防御
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // 未定義フィールド除去
      transform: true,             // 型変換
      forbidNonWhitelisted: true,  // 余分なフィールドは 400
      transformOptions: {
        enableImplicitConversion: true,
      },
      // XSS 対策: 文字列から危険なタグを無効化 (基本バリデーション)
      stopAtFirstError: false,
    }),
  );

  // ─── API プレフィックス ───────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── W4-012: Swagger / OpenAPI ドキュメント ──────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Chatbot SaaS API')
    .setDescription(
      `## AI Chatbot SaaS Platform API

### 認証方法
- **JWT Bearer Token**: ダッシュボード・管理API用
- **x-internal-secret Header**: LINE Bot・Widgetなど内部サービス用

### レートリミット
- Short: 30 req / 10秒
- Medium: 100 req / 60秒
- Long: 1000 req / 1時間

### 主要エンドポイント
- \`POST /api/v1/auth/register\` — テナント登録
- \`POST /api/v1/auth/login\` — ログイン
- \`GET /api/v1/faqs\` — FAQ一覧
- \`POST /api/v1/ai/chat\` — AI応答生成
- \`GET /api/v1/analytics/overview\` — Analytics概要
- \`GET /health\` — ヘルスチェック
      `,
    )
    .setVersion('1.0.0')
    .setContact('AI Chatbot SaaS', 'https://github.com/NekoyaJolly/AI_Chatbot', 'support@example.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:4000', 'Local Development')
    .addServer('https://api.your-domain.run.app', 'Production (Cloud Run)')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT access token (ログイン後に取得)',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-internal-secret',
        description: '内部サービス用シークレット (LINE Bot, Widget)',
      },
      'internal-secret',
    )
    .addTag('Health', 'ヘルスチェック')
    .addTag('Auth', '認証・認可')
    .addTag('FAQs', 'FAQ管理 (CRUD + 一括インポート + ベクトル検索)')
    .addTag('AI Chat', 'AI応答生成 (RAG + Gemini)')
    .addTag('Chat', 'チャットセッション管理')
    .addTag('Analytics', 'チャット統計・FAQ人気度・ユーザーエンゲージメント')
    .addTag('LINE Bot', 'LINE Messaging API Webhook')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'AI Chatbot API Docs',
  });

  // ─── サーバー起動 ─────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`✅ NestJS API running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`🔒 Helmet + CORS + ThrottlerGuard active`);
}

bootstrap();
