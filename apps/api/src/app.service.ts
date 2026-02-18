// apps/api/src/app.service.ts
// W1-007: NestJS アプリケーションサービス

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'AI Chatbot SaaS API v1.0 🚀';
  }
}
