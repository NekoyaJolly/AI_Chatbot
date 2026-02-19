// apps/line-bot/src/app.module.ts
// LINE Bot アプリケーションルートモジュール

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LineModule } from './line/line.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LineModule,
  ],
})
export class AppModule {}
