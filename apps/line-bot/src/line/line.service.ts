// apps/line-bot/src/line/line.service.ts
// W4-001/002: LINE Bot サービス (メッセージ受信 → AI応答 → Reply)

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as line from '@line/bot-sdk';
import { LineEvent, LineWebhookBody } from './line-webhook.dto';

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);
  private readonly client: line.messagingApi.MessagingApiClient;
  private readonly channelSecret: string;

  constructor(private readonly config: ConfigService) {
    const channelAccessToken = this.config.get<string>('LINE_CHANNEL_ACCESS_TOKEN', '');
    this.channelSecret = this.config.get<string>('LINE_CHANNEL_SECRET', '');

    this.client = new line.messagingApi.MessagingApiClient({
      channelAccessToken,
    });
  }

  /**
   * Webhookシグネチャ検証
   */
  validateSignature(body: string, signature: string): boolean {
    return line.validateSignature(body, this.channelSecret, signature);
  }

  /**
   * Webhookイベント処理
   */
  async handleWebhook(body: LineWebhookBody): Promise<void> {
    await Promise.all(
      body.events.map((event) => this.handleEvent(event)),
    );
  }

  /**
   * 個別イベントハンドラ
   */
  private async handleEvent(event: LineEvent): Promise<void> {
    this.logger.log(`LINE event: type=${event.type}, userId=${event.source.userId}`);

    // メッセージイベントのみ処理
    if (event.type !== 'message' || event.message?.type !== 'text') {
      return;
    }

    const userMessage = event.message.text ?? '';
    const userId = event.source.userId ?? 'unknown';
    const replyToken = event.replyToken;

    if (!replyToken) return;

    try {
      // AI応答取得 (apps/api の /ai/chat エンドポイントを呼び出し)
      const aiResponse = await this.callAiChat(userId, userMessage);

      // LINE Reply API で返信
      await this.client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: aiResponse,
          },
          // エスカレーション時はクイックリプライ付きメッセージ
        ],
      });

      this.logger.log(`Replied to ${userId}: ${aiResponse.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(
        `Reply failed for ${userId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // エラー時のフォールバック返信
      await this.client.replyMessage({
        replyToken,
        messages: [
          {
            type: 'text',
            text: '申し訳ありません。ただいまシステムに問題が発生しています。しばらくしてからお試しください。',
          },
        ],
      });
    }
  }

  /**
   * AI Chatエンドポイント呼び出し
   * 実運用では apps/api と同一プロセス or 内部HTTP呼び出し
   */
  private async callAiChat(userId: string, message: string): Promise<string> {
    const apiUrl = this.config.get<string>('API_INTERNAL_URL', 'http://localhost:4000');
    const tenantId = this.config.get<string>('DEFAULT_TENANT_ID', '');

    const response = await fetch(`${apiUrl}/api/v1/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': this.config.get<string>('INTERNAL_API_SECRET', ''),
      },
      body: JSON.stringify({
        tenantId,
        message,
        channel: 'line',
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json() as { answer: string };
    return data.answer ?? 'ご質問の回答が見つかりませんでした。スタッフにお問い合わせください。';
  }

  /**
   * W4-003: リッチメニュー設定
   */
  async setupRichMenu(): Promise<string> {
    const response = await this.client.createRichMenu({
      size: { width: 2500, height: 1686 },
      selected: true,
      name: 'Main Menu',
      chatBarText: 'メニューを開く',
      areas: [
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: { type: 'message', text: 'よくある質問' },
        },
        {
          bounds: { x: 833, y: 0, width: 833, height: 843 },
          action: { type: 'message', text: '営業時間を教えてください' },
        },
        {
          bounds: { x: 1666, y: 0, width: 834, height: 843 },
          action: { type: 'message', text: '予約したい' },
        },
        {
          bounds: { x: 0, y: 843, width: 833, height: 843 },
          action: { type: 'message', text: 'お問い合わせ' },
        },
        {
          bounds: { x: 833, y: 843, width: 833, height: 843 },
          action: { type: 'uri', uri: 'https://example.com' },
        },
        {
          bounds: { x: 1666, y: 843, width: 834, height: 843 },
          action: { type: 'message', text: '料金を教えてください' },
        },
      ],
    });

    const richMenuId = response.richMenuId;
    this.logger.log(`Rich menu created: ${richMenuId}`);
    return richMenuId;
  }

}
