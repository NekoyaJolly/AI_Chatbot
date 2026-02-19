// apps/api/src/chat/chat.service.ts
// W3-004: チャット履歴保存サービス

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateSessionOptions {
  tenantId: string;
  customerId?: string;
  channel: 'web' | 'line' | 'widget';
}

export interface SaveMessageOptions {
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  tokens?: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * チャットセッション作成
   */
  async createSession(options: CreateSessionOptions) {
    const session = await this.prisma.chatSession.create({
      data: {
        tenantId: options.tenantId,
        customerId: options.customerId,
        channel: options.channel,
      },
    });
    this.logger.log(`Session created: ${session.id} (tenant: ${options.tenantId})`);
    return session;
  }

  /**
   * メッセージ保存
   */
  async saveMessage(options: SaveMessageOptions) {
    return this.prisma.chatMessage.create({
      data: {
        sessionId: options.sessionId,
        role: options.role,
        content: options.content,
        metadata: options.metadata,
        tokens: options.tokens,
      },
    });
  }

  /**
   * セッション終了
   */
  async endSession(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return null;

    const duration = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000,
    );

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date(), duration },
    });
  }

  /**
   * セッションをエスカレーション済みにマーク
   */
  async markEscalated(sessionId: string, reason?: string) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        isEscalated: true,
        escalatedAt: new Date(),
        feedback: reason,
      },
    });
  }

  /**
   * セッションのメッセージ履歴を取得
   */
  async getSessionMessages(sessionId: string) {
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * テナントのセッション一覧
   */
  async getTenantSessions(tenantId: string, limit = 50) {
    return this.prisma.chatSession.findMany({
      where: { tenantId },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        _count: { select: { messages: true } },
      },
    });
  }
}
