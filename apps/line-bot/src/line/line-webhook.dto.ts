// apps/line-bot/src/line/line-webhook.dto.ts
// LINE Webhook ペイロード型定義

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

export interface LineEvent {
  type: string;
  message?: LineMessage;
  replyToken?: string;
  source: LineSource;
  timestamp: number;
  mode: string;
}

export interface LineMessage {
  type: string;
  id: string;
  text?: string;
}

export interface LineSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}
