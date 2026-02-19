// apps/api/src/ai/ai-chat.dto.ts
// W4-002: AI Chat REST エンドポイント DTOs (LINE Bot 内部呼び出し用)

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum ChatChannel {
  WEB = 'web',
  LINE = 'line',
  WIDGET = 'widget',
}

export class AiChatRequestDto {
  @ApiProperty({ description: 'テナントID', example: 'tenant-uuid-123' })
  @IsString()
  @IsNotEmpty()
  tenantId: string = '';

  @ApiProperty({ description: 'ユーザーメッセージ', example: 'トリミングの予約をしたいです' })
  @IsString()
  @IsNotEmpty()
  message: string = '';

  @ApiPropertyOptional({
    description: 'チャネル種別',
    enum: ChatChannel,
    default: ChatChannel.WEB,
  })
  @IsEnum(ChatChannel)
  @IsOptional()
  channel?: ChatChannel = ChatChannel.WEB;

  @ApiPropertyOptional({ description: '外部ユーザーID (LINE userId など)', example: 'U-line-user-001' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: '会話履歴 (直近8ターン)',
    example: [{ role: 'user', content: '前の質問' }, { role: 'assistant', content: '前の回答' }],
  })
  @IsArray()
  @IsOptional()
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export class MatchedFaqDto {
  @ApiProperty({ example: 'トリミング料金はいくらですか？' })
  question: string = '';

  @ApiProperty({ example: '小型犬は3,000円〜、中型犬は5,000円〜です。' })
  answer: string = '';

  @ApiPropertyOptional({ example: 0.95 })
  similarity?: number;
}

export class AiChatResponseDto {
  @ApiProperty({ description: 'AI生成回答', example: 'トリミングの予約は...' })
  answer: string = '';

  @ApiProperty({ description: '信頼スコア (0.0~1.0)', example: 0.87 })
  confidence: number = 0;

  @ApiProperty({ description: 'エスカレーション要否', example: false })
  shouldEscalate: boolean = false;

  @ApiPropertyOptional({ description: 'エスカレーション理由', example: '緊急キーワード検出' })
  escalationReason?: string;

  @ApiProperty({ description: 'マッチしたFAQ一覧', type: [MatchedFaqDto] })
  matchedFaqs: MatchedFaqDto[] = [];

  @ApiPropertyOptional({ description: 'トークン使用量', example: 512 })
  tokensUsed?: number;

  @ApiProperty({ description: '応答時間 (ms)', example: 1234 })
  responseTimeMs: number = 0;
}
