// apps/line-bot/tests/line.e2e-spec.ts
// W4-002: LINE Bot E2Eテスト (LINE Bot Simulator シミュレート)

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as crypto from 'crypto';
import { LineModule } from '../src/line/line.module';

// ─── テスト用ヘルパー ────────────────────────────────────────────────────────

function createLineSignature(body: string, secret: string): string {
  return crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64');
}

// ─── モック fetch ─────────────────────────────────────────────────────────────

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ answer: 'テスト回答です。' }),
});

// ─── LINE クライアントモック ────────────────────────────────────────────────────

vi.mock('@line/bot-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@line/bot-sdk')>();
  return {
    ...actual,
    messagingApi: {
      MessagingApiClient: vi.fn().mockImplementation(() => ({
        replyMessage: vi.fn().mockResolvedValue({}),
        createRichMenu: vi.fn().mockResolvedValue('rich-menu-id-test'),
        setDefaultRichMenu: vi.fn().mockResolvedValue({}),
        getRichMenuList: vi.fn().mockResolvedValue({ richmenus: [] }),
        deleteRichMenu: vi.fn().mockResolvedValue({}),
      })),
    },
    validateSignature: vi.fn((body: string, secret: string, signature: string) => {
      const expected = createLineSignature(body, secret);
      return signature === expected;
    }),
  };
});

// ─── テスト ────────────────────────────────────────────────────────────────────

describe('LINE Bot (E2E)', () => {
  let app: INestApplication;
  const TEST_SECRET = 'test-channel-secret-12345';
  const TEST_TOKEN = 'test-access-token';

  beforeAll(async () => {
    global.fetch = mockFetch as unknown as typeof fetch;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              LINE_CHANNEL_SECRET: TEST_SECRET,
              LINE_CHANNEL_ACCESS_TOKEN: TEST_TOKEN,
              API_INTERNAL_URL: 'http://localhost:4000',
              DEFAULT_TENANT_ID: 'tenant-test-123',
              INTERNAL_API_SECRET: 'internal-secret',
            }),
          ],
        }),
        LineModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── テスト: シグネチャ検証 ─────────────────────────────────────────────────

  it('[W4-001] rejects webhook without signature header', async () => {
    const { default: request } = await import('supertest');
    const body = JSON.stringify({ destination: 'U123', events: [] });

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .send(body);

    expect(res.status).toBe(400);
  });

  it('[W4-001] rejects webhook with invalid signature', async () => {
    const { default: request } = await import('supertest');
    const body = JSON.stringify({ destination: 'U123', events: [] });

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', 'invalid-signature-xyz')
      .send(body);

    expect(res.status).toBe(400);
  });

  it('[W4-001] accepts webhook with valid signature and returns 200', async () => {
    const { default: request } = await import('supertest');
    const body = JSON.stringify({ destination: 'U123', events: [] });
    const signature = createLineSignature(body, TEST_SECRET);

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  // ─── テスト: テキストメッセージ処理 ────────────────────────────────────────

  it('[W4-002] handles text message event and calls AI API', async () => {
    const { default: request } = await import('supertest');
    mockFetch.mockClear();

    const webhookBody = {
      destination: 'U123',
      events: [
        {
          type: 'message',
          message: { type: 'text', id: 'msg-001', text: 'トリミングの予約をしたいです' },
          replyToken: 'reply-token-abc',
          source: { type: 'user', userId: 'U-user-001' },
          timestamp: Date.now(),
          mode: 'active',
        },
      ],
    };

    const bodyStr = JSON.stringify(webhookBody);
    const signature = createLineSignature(bodyStr, TEST_SECRET);

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(webhookBody);

    expect(res.status).toBe(200);

    // 非同期処理の完了を少し待つ
    await new Promise((r) => setTimeout(r, 100));

    // AI API が呼ばれたことを確認
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/ai/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      }),
    );
  });

  it('[W4-002] ignores non-text message events', async () => {
    const { default: request } = await import('supertest');
    mockFetch.mockClear();

    const webhookBody = {
      destination: 'U123',
      events: [
        {
          type: 'message',
          message: { type: 'image', id: 'img-001' }, // 画像メッセージ
          replyToken: 'reply-token-xyz',
          source: { type: 'user', userId: 'U-user-002' },
          timestamp: Date.now(),
          mode: 'active',
        },
      ],
    };

    const bodyStr = JSON.stringify(webhookBody);
    const signature = createLineSignature(bodyStr, TEST_SECRET);

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(webhookBody);

    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 100));
    // 画像メッセージは AI API を呼ばない
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('[W4-002] handles follow event (ユーザー友だち追加)', async () => {
    const { default: request } = await import('supertest');

    const webhookBody = {
      destination: 'U123',
      events: [
        {
          type: 'follow',
          replyToken: 'follow-reply-token',
          source: { type: 'user', userId: 'U-new-user' },
          timestamp: Date.now(),
          mode: 'active',
        },
      ],
    };

    const bodyStr = JSON.stringify(webhookBody);
    const signature = createLineSignature(bodyStr, TEST_SECRET);

    const res = await request(app.getHttpServer())
      .post('/line/webhook')
      .set('Content-Type', 'application/json')
      .set('x-line-signature', signature)
      .send(webhookBody);

    expect(res.status).toBe(200);
  });
});
