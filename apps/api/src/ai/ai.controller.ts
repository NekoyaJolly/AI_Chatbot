// apps/api/src/ai/ai.controller.ts
// W4-002: AI Chat REST エンドポイント
// LINE Bot / Embed Widget からの内部呼び出しに対応

import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { AiChatRequestDto, AiChatResponseDto } from './ai-chat.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('AI Chat')
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {}

  /**
   * POST /api/v1/ai/chat
   * AI応答生成エンドポイント
   *
   * 認証方式:
   * 1. x-internal-secret ヘッダー → LINE Bot / Widget など内部サービス用
   * 2. Bearer JWT → ダッシュボードなど通常ユーザー用 (Public + 手動検証)
   */
  @Post('chat')
  @Public()
  @ApiOperation({
    summary: 'AI Chat応答生成',
    description: 'RAGパイプラインでFAQ検索 → Gemini生成 → 応答返却',
  })
  @ApiHeader({
    name: 'x-internal-secret',
    description: 'Internal service secret (LINE Bot / Widget用)',
    required: false,
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'AI応答成功', type: AiChatResponseDto })
  @ApiResponse({ status: 401, description: '認証失敗' })
  @ApiResponse({ status: 400, description: 'リクエスト不正' })
  async chat(
    @Body() dto: AiChatRequestDto,
    @Headers('x-internal-secret') internalSecret?: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<AiChatResponseDto> {
    // ─── 認証 ────────────────────────────────────────────────────────────────
    const expectedSecret = this.config.get<string>('INTERNAL_API_SECRET', '');
    const isInternalCall = expectedSecret && internalSecret === expectedSecret;
    const isBearerToken = authHeader?.startsWith('Bearer ');

    if (!isInternalCall && !isBearerToken) {
      this.logger.warn(`Unauthorized /ai/chat attempt. tenantId=${dto.tenantId}`);
      throw new UnauthorizedException('Authentication required');
    }

    // ─── AI応答生成 ──────────────────────────────────────────────────────────
    this.logger.log(
      `AI chat: tenantId=${dto.tenantId}, channel=${dto.channel ?? 'web'}, msg="${dto.message.substring(0, 50)}"`,
    );

    const conversationHistory = dto.conversationHistory?.map((h) => ({
      role: h.role,
      content: h.content,
    })) ?? [];

    const result = await this.aiService.generateResponse(
      dto.tenantId,
      dto.message,
      conversationHistory,
    );

    const response: AiChatResponseDto = {
      answer: result.answer,
      confidence: result.confidence,
      shouldEscalate: result.shouldEscalate,
      escalationReason: result.escalationReason,
      matchedFaqs: result.matchedFaqs,
      tokensUsed: result.tokensUsed,
      responseTimeMs: result.responseTimeMs,
    };

    this.logger.log(
      `AI response: confidence=${result.confidence.toFixed(2)}, escalate=${result.shouldEscalate}, ` +
      `${result.responseTimeMs}ms`,
    );

    return response;
  }
}
