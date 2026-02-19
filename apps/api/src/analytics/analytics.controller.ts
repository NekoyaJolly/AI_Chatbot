// apps/api/src/analytics/analytics.controller.ts
// W4-004: Analytics コントローラー

import {
  Controller,
  Get,
  Query,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import {
  DateRangeQueryDto,
  ChatStatsResponseDto,
  FaqPopularityResponseDto,
  UserEngagementResponseDto,
  OverviewStatsResponseDto,
} from './analytics.dto';

// JWT ペイロード型 (apps/api の auth から流用)
interface JwtUser {
  sub: string;
  email: string;
  tenantId: string;
  role: string;
}

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/v1/analytics/overview
   * ダッシュボード概要統計
   */
  @Get('overview')
  @ApiOperation({ summary: 'ダッシュボード概要統計取得' })
  @ApiResponse({ status: 200, type: OverviewStatsResponseDto })
  async getOverview(@Req() req: Request): Promise<OverviewStatsResponseDto> {
    const tenantId = (req.user as JwtUser).tenantId;
    this.logger.log(`Analytics overview: tenantId=${tenantId}`);
    return this.analyticsService.getOverview(tenantId);
  }

  /**
   * GET /api/v1/analytics/chat-stats
   * 日次チャット統計 (期間指定)
   */
  @Get('chat-stats')
  @ApiOperation({ summary: 'チャット統計取得 (日次)' })
  @ApiResponse({ status: 200, type: ChatStatsResponseDto })
  async getChatStats(
    @Req() req: Request,
    @Query() query: DateRangeQueryDto,
  ): Promise<ChatStatsResponseDto> {
    const tenantId = (req.user as JwtUser).tenantId;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.analyticsService.getChatStats(tenantId, from, to);
  }

  /**
   * GET /api/v1/analytics/faq-popularity
   * FAQ 参照回数ランキング
   */
  @Get('faq-popularity')
  @ApiOperation({ summary: 'FAQ人気度ランキング取得' })
  @ApiResponse({ status: 200, type: FaqPopularityResponseDto })
  async getFaqPopularity(
    @Req() req: Request,
    @Query() query: DateRangeQueryDto,
  ): Promise<FaqPopularityResponseDto> {
    const tenantId = (req.user as JwtUser).tenantId;
    return this.analyticsService.getFaqPopularity(tenantId, query.limit ?? 10);
  }

  /**
   * GET /api/v1/analytics/user-engagement
   * ユーザーエンゲージメント分析
   */
  @Get('user-engagement')
  @ApiOperation({ summary: 'ユーザーエンゲージメント分析取得' })
  @ApiResponse({ status: 200, type: UserEngagementResponseDto })
  async getUserEngagement(
    @Req() req: Request,
    @Query() query: DateRangeQueryDto,
  ): Promise<UserEngagementResponseDto> {
    const tenantId = (req.user as JwtUser).tenantId;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;

    return this.analyticsService.getUserEngagement(tenantId, from, to);
  }
}
