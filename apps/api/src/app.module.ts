// apps/api/src/app.module.ts
// NestJS アプリケーションルートモジュール

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FaqsModule } from './faqs/faqs.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuthModule,
    FaqsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
export class AppModule {}
