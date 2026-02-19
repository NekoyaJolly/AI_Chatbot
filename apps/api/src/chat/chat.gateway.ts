// apps/api/src/chat/chat.gateway.ts
// W3-003: WebSocket Gateway完全実装 (AI統合・セッション管理)

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AiService, ChatMessage as AiChatMessage } from '../ai/ai.service';
import { ChatService } from './chat.service';
import { StartChatDto } from './dto/start-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

interface ClientSession {
  sessionId: string;
  tenantId: string;
  history: AiChatMessage[];
}

/** Maximum number of messages to keep in per-client in-memory history */
const MAX_HISTORY_SIZE = 20;

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  // クライアントID → セッション情報のマップ
  // NOTE:
  // - This map is stored only in process memory and is not shared across instances.
  // - All session data stored here will be lost if the server restarts or crashes.
  // - For production use, consider replacing this with a persistent or shared store
  //   (e.g., Redis or a database) or redesigning the gateway to use stateless
  //   session management that can recover state from the backend on reconnection.
  private readonly sessions = new Map<string, ClientSession>();

  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', {
      message: 'WebSocket接続成功',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // セッション終了処理
    const session = this.sessions.get(client.id);
    if (session) {
      await this.chatService.endSession(session.sessionId).catch(() => null);
      this.sessions.delete(client.id);
    }
  }

  /**
   * チャット開始 - セッション作成
   */
  @SubscribeMessage('chat:start')
  async handleChatStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: StartChatDto,
  ) {
    try {
      // DTO バリデーション
      const dto = plainToInstance(StartChatDto, payload);
      const errors = await validate(dto);
      if (errors.length > 0) {
        client.emit('chat:error', {
          message: '入力データが不正です。tenantId を確認してください。',
        });
        return;
      }

      const session = await this.chatService.createSession({
        tenantId: dto.tenantId,
        customerId: dto.customerId,
        channel: dto.channel ?? 'web',
      });

      this.sessions.set(client.id, {
        sessionId: session.id,
        tenantId: dto.tenantId,
        history: [],
      });

      client.emit('chat:started', {
        sessionId: session.id,
        message: 'チャットを開始しました。ご質問をどうぞ。',
      });

      this.logger.log(`Chat started: ${session.id} (client: ${client.id})`);
    } catch (error) {
      this.logger.error(
        `Failed to start chat for tenant ${payload?.tenantId} (client: ${client.id})`,
        error instanceof Error ? error.stack : String(error),
      );

      let userMessage = 'チャットの開始に失敗しました';
      if (error instanceof Error && typeof error.message === 'string') {
        const msg = error.message;
        if (/tenant/i.test(msg) || /テナント/.test(msg)) {
          userMessage = 'テナントが見つかりません。店舗コードを確認してください。';
        } else if (
          /ECONNREFUSED/i.test(msg) ||
          /database/i.test(msg) ||
          /\bDB\b/i.test(msg) ||
          /接続/.test(msg)
        ) {
          userMessage =
            'システムエラーによりチャットを開始できません。しばらくしてから再度お試しください。';
        }
      }

      client.emit('chat:error', { message: userMessage });
    }
  }

  /**
   * メッセージ受信 → AI応答生成 → 返信
   */
  @SubscribeMessage('chat:message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const clientSession = this.sessions.get(client.id);
    if (!clientSession) {
      client.emit('chat:error', { message: 'セッションが見つかりません。chat:start を先に呼び出してください。' });
      return;
    }

    // DTO バリデーション
    const dto = plainToInstance(SendMessageDto, payload);
    const errors = await validate(dto);
    if (errors.length > 0) {
      client.emit('chat:error', {
        message: 'メッセージの形式が不正です。',
      });
      return;
    }

    const { sessionId, tenantId, history } = clientSession;

    try {
      // ユーザーメッセージ保存
      await this.chatService.saveMessage({
        sessionId,
        role: 'user',
        content: dto.content,
      });

      // 会話履歴に追加 (スライディングウィンドウで上限を維持)
      history.push({ role: 'user', content: dto.content });
      if (history.length > MAX_HISTORY_SIZE) {
        history.splice(0, history.length - MAX_HISTORY_SIZE);
      }

      // タイピングインジケーター
      client.emit('chat:typing', { isTyping: true });

      // AI 応答生成
      const aiResponse = await this.aiService.generateResponse(
        tenantId,
        dto.content,
        history.slice(-8),
      );

      // AI メッセージ保存
      await this.chatService.saveMessage({
        sessionId,
        role: 'assistant',
        content: aiResponse.answer,
        metadata: {
          confidence: aiResponse.confidence,
          shouldEscalate: aiResponse.shouldEscalate,
          matchedFaqCount: aiResponse.matchedFaqs.length,
          responseTimeMs: aiResponse.responseTimeMs,
        },
        tokens: aiResponse.tokensUsed,
      });

      // 会話履歴に追加 (スライディングウィンドウで上限を維持)
      history.push({ role: 'assistant', content: aiResponse.answer });
      if (history.length > MAX_HISTORY_SIZE) {
        history.splice(0, history.length - MAX_HISTORY_SIZE);
      }

      // タイピング終了
      client.emit('chat:typing', { isTyping: false });

      // 応答送信
      client.emit('chat:response', {
        sessionId,
        content: aiResponse.answer,
        confidence: aiResponse.confidence,
        shouldEscalate: aiResponse.shouldEscalate,
        escalationReason: aiResponse.escalationReason,
        matchedFaqs: aiResponse.matchedFaqs,
        responseTimeMs: aiResponse.responseTimeMs,
        timestamp: new Date().toISOString(),
      });

      // エスカレーション処理
      if (aiResponse.shouldEscalate) {
        await this.chatService.markEscalated(sessionId, aiResponse.escalationReason);
        client.emit('chat:escalation', {
          sessionId,
          reason: aiResponse.escalationReason,
          message: 'スタッフがご対応いたします。少々お待ちください。',
        });
        this.logger.warn(
          `Escalation: session=${sessionId}, reason=${aiResponse.escalationReason}`,
        );
      }
    } catch (error) {
      client.emit('chat:typing', { isTyping: false });
      client.emit('chat:error', {
        message: '応答の生成中にエラーが発生しました。しばらく経ってからお試しください。',
      });
      this.logger.error(
        `Chat error for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * セッション終了
   */
  @SubscribeMessage('chat:end')
  async handleChatEnd(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (session) {
      await this.chatService.endSession(session.sessionId).catch(() => null);
      this.sessions.delete(client.id);
      client.emit('chat:ended', { sessionId: session.sessionId });
    }
  }

  /**
   * Ping (ヘルスチェック用)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): string {
    return 'pong';
  }
}
