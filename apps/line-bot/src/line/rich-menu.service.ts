// apps/line-bot/src/line/rich-menu.service.ts
// W4-003: LINE リッチメニュー管理サービス

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as line from '@line/bot-sdk';

@Injectable()
export class RichMenuService {
  private readonly logger = new Logger(RichMenuService.name);
  private readonly client: line.messagingApi.MessagingApiClient;

  constructor(private readonly config: ConfigService) {
    const channelAccessToken = this.config.get<string>('LINE_CHANNEL_ACCESS_TOKEN', '');
    this.client = new line.messagingApi.MessagingApiClient({ channelAccessToken });
  }

  /**
   * メインリッチメニュー作成 (6タイル: 2行×3列)
   * サイズ: 2500×1686px (LINE推奨)
   */
  async createMainMenu(): Promise<string> {
    const response = await this.client.createRichMenu({
      size: { width: 2500, height: 1686 },
      selected: true,
      name: 'Main Menu v1',
      chatBarText: 'メニューを開く',
      areas: [
        // 上段左: よくある質問
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: {
            type: 'message',
            label: 'よくある質問',
            text: 'よくある質問を教えてください',
          },
        },
        // 上段中: 営業時間
        {
          bounds: { x: 833, y: 0, width: 833, height: 843 },
          action: {
            type: 'message',
            label: '営業時間',
            text: '営業時間を教えてください',
          },
        },
        // 上段右: 予約
        {
          bounds: { x: 1666, y: 0, width: 834, height: 843 },
          action: {
            type: 'message',
            label: '予約',
            text: '予約をしたいのですが',
          },
        },
        // 下段左: お問い合わせ
        {
          bounds: { x: 0, y: 843, width: 833, height: 843 },
          action: {
            type: 'message',
            label: 'お問い合わせ',
            text: 'スタッフに相談したいです',
          },
        },
        // 下段中: 公式サイト (URI)
        {
          bounds: { x: 833, y: 843, width: 833, height: 843 },
          action: {
            type: 'uri',
            label: '公式サイト',
            uri: this.config.get<string>('SHOP_WEBSITE_URL', 'https://example.com'),
          },
        },
        // 下段右: 料金案内
        {
          bounds: { x: 1666, y: 843, width: 834, height: 843 },
          action: {
            type: 'message',
            label: '料金案内',
            text: '料金を教えてください',
          },
        },
      ],
    });

    const richMenuId = response.richMenuId;
    this.logger.log(`Rich menu created: ${richMenuId}`);
    return richMenuId;
  }

  /**
   * リッチメニューを全ユーザーにデフォルト設定
   */
  async setDefaultMenu(richMenuId: string): Promise<void> {
    await this.client.setDefaultRichMenu(richMenuId);
    this.logger.log(`Default rich menu set: ${richMenuId}`);
  }

  /**
   * 既存リッチメニュー一覧取得
   */
  async listMenus(): Promise<line.messagingApi.RichMenuListResponse> {
    return this.client.getRichMenuList();
  }

  /**
   * リッチメニュー削除
   */
  async deleteMenu(richMenuId: string): Promise<void> {
    await this.client.deleteRichMenu(richMenuId);
    this.logger.log(`Rich menu deleted: ${richMenuId}`);
  }

  /**
   * クイックリプライ生成 (FAQ カテゴリ選択用)
   * @returns LINE QuickReply アイテム配列
   */
  buildFaqQuickReply(categories: string[]): line.messagingApi.QuickReply {
    const items: line.messagingApi.QuickReplyItem[] = categories.slice(0, 13).map((cat) => ({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: cat.length > 20 ? cat.substring(0, 20) : cat,
        text: cat,
      },
    }));

    return { items };
  }
}
