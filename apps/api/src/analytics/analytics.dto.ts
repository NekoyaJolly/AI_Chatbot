// apps/api/src/analytics/analytics.dto.ts
// W4-004: Analytics API DTOs

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// ─── リクエスト ─────────────────────────────────────────────────────────────────

export class DateRangeQueryDto {
  @ApiPropertyOptional({
    description: '開始日 (ISO 8601)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  from?: string;

  @ApiPropertyOptional({
    description: '終了日 (ISO 8601)',
    example: '2026-01-31T23:59:59.999Z',
  })
  @IsDateString()
  @IsOptional()
  to?: string;

  @ApiPropertyOptional({ description: '取得件数上限', example: 10, default: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}

// ─── レスポンス ─────────────────────────────────────────────────────────────────

export class DailyChatStatDto {
  @ApiProperty({ example: '2026-01-15' })
  date: string = '';

  @ApiProperty({ example: 42 })
  totalSessions: number = 0;

  @ApiProperty({ example: 38 })
  aiResolvedSessions: number = 0;

  @ApiProperty({ example: 4 })
  escalatedSessions: number = 0;

  @ApiProperty({ description: 'AI解決率 (%)', example: 90.5 })
  aiResolutionRate: number = 0;

  @ApiProperty({ description: 'エスカレーション率 (%)', example: 9.5 })
  escalationRate: number = 0;

  @ApiProperty({ description: '平均信頼スコア', example: 0.84 })
  avgConfidence: number = 0;

  @ApiProperty({ description: '平均セッション時間 (秒)', example: 87 })
  avgDurationSecs: number = 0;
}

export class ChatStatsResponseDto {
  @ApiProperty({ description: '日次統計一覧', type: [DailyChatStatDto] })
  dailyStats: DailyChatStatDto[] = [];

  @ApiProperty({ description: '期間合計セッション数', example: 320 })
  totalSessions: number = 0;

  @ApiProperty({ description: '期間AI解決率 (%)', example: 88.7 })
  aiResolutionRate: number = 0;

  @ApiProperty({ description: '期間エスカレーション率 (%)', example: 11.3 })
  escalationRate: number = 0;

  @ApiProperty({ description: '期間平均信頼スコア', example: 0.82 })
  avgConfidence: number = 0;
}

export class FaqPopularityItemDto {
  @ApiProperty({ example: 'faq-uuid-123' })
  id: string = '';

  @ApiProperty({ example: 'トリミングの予約はどうすればいいですか？' })
  question: string = '';

  @ApiProperty({ example: '電話またはLINEでご予約ください。' })
  answer: string = '';

  @ApiPropertyOptional({ example: '予約' })
  category?: string | null;

  @ApiProperty({ description: '参照回数', example: 156 })
  viewCount: number = 0;

  @ApiProperty({ description: '順位', example: 1 })
  rank: number = 0;
}

export class FaqPopularityResponseDto {
  @ApiProperty({ type: [FaqPopularityItemDto] })
  items: FaqPopularityItemDto[] = [];

  @ApiProperty({ example: 150 })
  totalFaqs: number = 0;
}

export class UserEngagementResponseDto {
  @ApiProperty({ description: 'アクティブユーザー数 (ユニーク)', example: 87 })
  activeUsers: number = 0;

  @ApiProperty({ description: '新規ユーザー数', example: 23 })
  newUsers: number = 0;

  @ApiProperty({ description: '1日平均セッション数', example: 12.3 })
  avgSessionsPerDay: number = 0;

  @ApiProperty({ description: '平均セッション時間 (秒)', example: 95 })
  avgSessionDurationSecs: number = 0;

  @ApiProperty({ description: 'チャネル別内訳', example: { web: 60, line: 30, widget: 10 } })
  channelBreakdown: Record<string, number> = {};
}

export class OverviewStatsResponseDto {
  @ApiProperty({ description: '今月セッション総数', example: 520 })
  totalSessionsThisMonth: number = 0;

  @ApiProperty({ description: '先月比増減 (%)', example: 12.5 })
  sessionGrowthRate: number = 0;

  @ApiProperty({ description: 'AI解決率 (%)', example: 88.7 })
  aiResolutionRate: number = 0;

  @ApiProperty({ description: '平均応答時間 (ms)', example: 1240 })
  avgResponseTimeMs: number = 0;

  @ApiProperty({ description: '登録FAQ数', example: 48 })
  totalFaqs: number = 0;

  @ApiProperty({ description: 'アクティブユーザー数 (今月)', example: 134 })
  activeUsersThisMonth: number = 0;
}
