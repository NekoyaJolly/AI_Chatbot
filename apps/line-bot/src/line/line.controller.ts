// apps/line-bot/src/line/line.controller.ts
// W4-001/002: LINE Webhook コントローラー

import {
  Controller,
  Post,
  Body,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { LineService } from './line.service';
import { LineWebhookBody } from './line-webhook.dto';

@ApiTags('LINE Bot')
@Controller('line')
export class LineController {
  private readonly logger = new Logger(LineController.name);

  constructor(private readonly lineService: LineService) {}

  /**
   * POST /line/webhook
   * LINE Messaging API Webhook エンドポイント
   * - シグネチャ検証 → イベント処理 → 200 OK
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'LINE Webhook endpoint', description: 'Receives LINE Messaging API events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid signature' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: LineWebhookBody,
    @Headers('x-line-signature') signature: string,
  ): Promise<{ status: string }> {
    // 生のリクエストボディを取得してシグネチャ検証
    const rawBody = req.rawBody?.toString('utf-8') ?? JSON.stringify(body);

    if (!signature) {
      this.logger.warn('Missing x-line-signature header');
      throw new BadRequestException('Missing LINE signature');
    }

    if (!this.lineService.validateSignature(rawBody, signature)) {
      this.logger.warn(`Invalid LINE signature. Rejecting webhook.`);
      throw new BadRequestException('Invalid LINE signature');
    }

    this.logger.log(`Webhook received: ${body.events?.length ?? 0} events`);

    // 非同期でイベント処理 (LINEは200をすぐ返す必要あり)
    this.lineService.handleWebhook(body).catch((err) => {
      this.logger.error(`Webhook processing error: ${err instanceof Error ? err.message : String(err)}`);
    });

    return { status: 'ok' };
  }

  /**
   * POST /line/setup-rich-menu
   * リッチメニュー設定 (管理者専用 - 内部シークレットで保護)
   */
  @Post('setup-rich-menu')
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async setupRichMenu(
    @Headers('x-admin-secret') secret: string,
  ): Promise<{ richMenuId: string }> {
    const expectedSecret = process.env.ADMIN_SECRET ?? '';
    if (!expectedSecret || secret !== expectedSecret) {
      throw new BadRequestException('Unauthorized');
    }

    const richMenuId = await this.lineService.setupRichMenu();
    this.logger.log(`Rich menu setup complete: ${richMenuId}`);
    return { richMenuId };
  }

  /**
   * GET /line/health
   * LINE Bot ヘルスチェック
   */
  @Post('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'LINE Bot health check' })
  @ApiResponse({ status: 200, description: 'Healthy' })
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
