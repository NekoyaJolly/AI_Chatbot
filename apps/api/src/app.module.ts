// apps/api/src/app.module.ts
// NestJS アプリケーションルートモジュール

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FaqsModule } from './faqs/faqs.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SanitizeMiddleware } from './common/middleware/sanitize.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // W4-008: レートリミット (ThrottlerModule)
    // 一般: 10req/min, 短期: 30req/10sec
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 10_000,    // 10秒
        limit: 30,       // 30リクエスト
      },
      {
        name: 'medium',
        ttl: 60_000,    // 60秒
        limit: 100,     // 100リクエスト
      },
      {
        name: 'long',
        ttl: 3_600_000, // 1時間
        limit: 1_000,   // 1000リクエスト
      },
    ]),
    PrismaModule,
    AuthModule,
    FaqsModule,
    ChatModule,
    AiModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // W4-008: グローバルレートリミットガード
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // W2-004: グローバル JWT ガード (全エンドポイントに適用)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // W2-013: グローバル例外フィルター
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // W4-010: 全エンドポイントに XSS/インジェクション対策ミドルウェア適用
    consumer.apply(SanitizeMiddleware).forRoutes('*');
  }
}
