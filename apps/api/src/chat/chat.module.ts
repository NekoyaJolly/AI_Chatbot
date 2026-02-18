// apps/api/src/chat/chat.module.ts
// W1-008: Chat モジュール

import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Module({
  providers: [ChatGateway],
})
export class ChatModule {}
