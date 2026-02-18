---
description: "NestJS 11 Backend - GCP Cloud Run向けバックエンド固有ルール。AI/RAG統合、マルチテナント、リアルタイムチャット、セキュリティのベストプラクティスを網羅。"
tags: ["agents-v1.1", "backend", "nestjs11", "cloudrun", "gemini", "langchain", "prisma", "redis", "bullmq", "websocket"]
version: 1.1.0
jurisdiction: "apps/api"
inherits: "/AGENTS.md"
last_updated: 2026-02-19
---

# AGENTS.md - Backend Rules (apps/api)

> **エージェントへの指示**: あなたはこのディレクトリ内のバックエンド実装の「最高責任者」です。ルートの `AGENTS.md` を継承しつつ、NestJS 11 の新機能と GCP Cloud Run の制約を厳格に適用してください。
> **管轄範囲**: このファイルは `apps/api/` 配下のすべてのファイルに適用されます。
> **親ルール**: ルートの `AGENTS.md` を継承し、矛盾する場合はこちらが優先されます。

---

## ⚙️ Backend Technology Stack (2026)

| Category          | Technology                                          |
| ----------------- | --------------------------------------------------- |
| **Runtime**       | Node.js 24 LTS (ESM by default)                    |
| **Language**      | TypeScript 5.6+ (`strict: true`)                    |
| **Framework**     | NestJS 11 (SWC compiler, Standalone App support)    |
| **API Style**     | RESTful + GraphQL (Apollo Server)                   |
| **ORM**           | Prisma 6 (PostgreSQL 16 + pgvector)                 |
| **AI/LLM**        | Gemini 3.0 Flash + Langchain.js                     |
| **Cache**         | Redis 7 (GCP Memorystore) + `@nestjs/cache-manager` |
| **Queue**         | BullMQ (ジョブキュー・非同期処理)                    |
| **WebSocket**     | Socket.io (`@nestjs/websockets`)                    |
| **Observability** | `@nestjs/otel` (Built-in OpenTelemetry)             |
| **Validation**    | class-validator + class-transformer                  |
| **Documentation** | Swagger/OpenAPI (`@nestjs/swagger`)                 |
| **Deployment**    | GCP Cloud Run (Direct VPC Egress)                   |

---

## 🛠️ NestJS 11 固有の注意事項

### 1. SWC コンパイラ (デフォルト化)

NestJS 11 では SWC (Speedy Web Compiler) がデフォルトです。ビルド速度が最大20倍向上します。

```json
// nest-cli.json
{
  "compilerOptions": {
    "compiler": "swc"
  }
}
```

### 2. ESM がデフォルト

Node.js 24+ に対応し、ECMAScript Modules がデフォルトです。`top-level await` が使用可能。

```typescript
// ✅ ESM (NestJS 11 デフォルト)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js'; // .js 拡張子を意識

const app = await NestFactory.create(AppModule);
await app.listen(3000);
```

### 3. スタンドアロンアプリケーション

NestJS 11 では `AppModule` なしでのブートストラップが可能です。マイクロサービスやサーバーレス関数に最適。

```typescript
// ✅ 小規模サービスやCLI向け
const app = await NestFactory.create(AppController);
```

> **本プロジェクトではモジュール構成を維持**します。スタンドアロンはスクリプト・CLI用途のみ。

### 4. 組み込み OpenTelemetry

`@nestjs/otel` パッケージにより、コントローラー・リゾルバー・DB呼び出しが自動計装されます。

```typescript
// app.module.ts
import { OpenTelemetryModule } from '@nestjs/otel';

@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      tracing: true,
      metrics: true,
    }),
    // ...
  ],
})
export class AppModule {}
```

### 5. JSON ロガー

`ConsoleLogger` がコンテナ環境向けにJSON出力をサポート。Cloud Run/Cloud Logging 統合に最適。

```typescript
import { ConsoleLogger } from '@nestjs/common';

const app = await NestFactory.create(AppModule, {
  logger: new ConsoleLogger({ json: true }),
});
```

### 6. 例外ハンドリング (正しいパターン)

NestJS 11 の例外ハンドリングは `HttpException` 系統を基本とします。

```typescript
// ✅ 期待されるビジネスエラー → 具体的な HttpException
if (!user) {
  throw new NotFoundException('User not found');
}

// ✅ 外部サービス障害 → InternalServerErrorException にラップ
try {
  await externalService.call();
} catch (error) {
  this.logger.error('External service failed', error.stack);
  throw new InternalServerErrorException('External service unavailable');
}
```

> **⚠️ 重要**: `IntrinsicException` は NestJS 11 の公式 API ではありません。使用しないでください。

### 7. Dependency Injection

- `@Injectable()` デコレータ必須
- Constructor Injection を優先
- Circular Dependency は `forwardRef()` で解決（ただし設計の見直しを最優先）

### 8. Module 構成

- 機能単位でモジュール分割 (Feature Module パターン)
- `@Global()` は最小限に (`CoreModule`, `DatabaseModule` のみ)
- `forwardRef()` よりもモジュール分割の見直しを先に検討

---

## 📁 ディレクトリ構造規約

```text
apps/api/
├── src/
│   ├── main.ts                    # エントリーポイント
│   ├── app.module.ts              # ルートモジュール
│   │
│   ├── config/                    # 設定ファイル
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── gemini.config.ts
│   │
│   ├── common/                    # 共通ユーティリティ
│   │   ├── filters/               # グローバルエラーハンドラー
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/                # 認証ガード
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── ws-jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/          # ログ・変換
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/                 # バリデーションパイプ
│   │   │   └── validation.pipe.ts
│   │   └── decorators/            # カスタムデコレーター
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   │
│   ├── modules/                   # ビジネスロジックモジュール
│   │   ├── auth/                  # 認証
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── tenants/               # テナント管理
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── faqs/                  # FAQ管理
│   │   │   ├── faqs.module.ts
│   │   │   ├── faqs.controller.ts
│   │   │   ├── faqs.service.ts
│   │   │   └── dto/
│   │   │       ├── create-faq.dto.ts
│   │   │       ├── update-faq.dto.ts
│   │   │       └── search-faq.dto.ts
│   │   │
│   │   ├── chat/                  # チャット処理
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.gateway.ts    # WebSocket Gateway
│   │   │   ├── chat.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── ai/                    # AI統合
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── embeddings.service.ts
│   │   │   └── prompts/           # プロンプトテンプレート
│   │   │       ├── pet-shop.ts
│   │   │       ├── beauty-salon.ts
│   │   │       └── index.ts
│   │   │
│   │   └── analytics/             # 分析API
│   │       ├── analytics.module.ts
│   │       ├── analytics.controller.ts
│   │       └── analytics.service.ts
│   │
│   └── prisma/                    # Prisma統合
│       ├── prisma.module.ts
│       └── prisma.service.ts
│
├── test/                          # テスト
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── prisma/                        # Migrations
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── nest-cli.json
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## 🏗️ 実装パターン (コード規約)

### 1. Module Structure

```typescript
// modules/faqs/faqs.module.ts

import { Module } from '@nestjs/common';
import { FaqsController } from './faqs.controller';
import { FaqsService } from './faqs.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [FaqsController],
  providers: [FaqsService],
  exports: [FaqsService],
})
export class FaqsModule {}
```

### 2. Controller Layer

```typescript
// modules/faqs/faqs.controller.ts

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateFaqDto, UpdateFaqDto, SearchFaqDto } from './dto';

@ApiTags('FAQs')
@ApiBearerAuth()
@Controller('faqs')
@UseGuards(JwtAuthGuard)
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'FAQ作成' })
  @ApiResponse({ status: 201, description: 'FAQ作成成功' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateFaqDto,
  ) {
    return this.faqsService.create(tenantId, dto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'セマンティック検索' })
  search(
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: SearchFaqDto,
  ) {
    return this.faqsService.search(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'FAQ一覧取得' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.faqsService.findAll(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'FAQ詳細取得' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.faqsService.findOne(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'FAQ更新' })
  update(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.faqsService.update(id, tenantId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'FAQ削除' })
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.faqsService.remove(id, tenantId);
  }
}
```

### 3. Service Layer

```typescript
// modules/faqs/faqs.service.ts

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../ai/embeddings.service';
import { CreateFaqDto, UpdateFaqDto, SearchFaqDto } from './dto';

@Injectable()
export class FaqsService {
  private readonly logger = new Logger(FaqsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async create(tenantId: string, dto: CreateFaqDto) {
    const embedding = await this.embeddings.generate(dto.question);

    return this.prisma.tenantFaq.create({
      data: {
        tenantId,
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        embedding: embedding as unknown as number[],
      },
    });
  }

  async search(tenantId: string, dto: SearchFaqDto) {
    const queryEmbedding = await this.embeddings.generate(dto.query);

    const results = await this.prisma.$queryRaw<
      Array<{ id: string; question: string; answer: string; category: string; similarity: number }>
    >`
      SELECT
        id, question, answer, category,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM tenant_faqs
      WHERE tenant_id = ${tenantId}::uuid
        AND is_active = true
        AND 1 - (embedding <=> ${queryEmbedding}::vector) > ${dto.threshold ?? 0.75}
      ORDER BY similarity DESC
      LIMIT ${dto.limit ?? 5}
    `;

    // 非同期でクリックカウント更新 (Fire and Forget)
    if (results.length > 0) {
      this.prisma.tenantFaq
        .updateMany({
          where: { id: { in: results.map((r) => r.id) } },
          data: { clickCount: { increment: 1 } },
        })
        .catch((error) => {
          this.logger.warn('Failed to update click count', error);
        });
    }

    return results;
  }

  async findAll(tenantId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.prisma.tenantFaq.findMany({
        where: { tenantId, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenantFaq.count({
        where: { tenantId, isActive: true },
      }),
    ]);

    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const faq = await this.prisma.tenantFaq.findFirst({
      where: { id, tenantId, isActive: true },
    });

    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }

    return faq;
  }

  async update(id: string, tenantId: string, dto: UpdateFaqDto) {
    const faq = await this.findOne(id, tenantId);

    let embedding: number[] | undefined;
    if (dto.question && dto.question !== faq.question) {
      embedding = await this.embeddings.generate(dto.question);
    }

    return this.prisma.tenantFaq.update({
      where: { id },
      data: {
        ...dto,
        ...(embedding && { embedding: embedding as unknown as number[] }),
      },
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    // 論理削除
    return this.prisma.tenantFaq.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

### 4. DTO (Data Transfer Object)

```typescript
// modules/faqs/dto/create-faq.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({
    description: 'FAQ質問文',
    example: '営業時間は何時から何時までですか?',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: '質問は5文字以上必要です' })
  @MaxLength(500, { message: '質問は500文字以内にしてください' })
  question: string;

  @ApiProperty({
    description: 'FAQ回答文',
    example: '平日10:00-19:00、土日10:00-18:00です',
    minLength: 5,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  answer: string;

  @ApiProperty({ description: 'カテゴリ', example: '店舗情報', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;
}
```

```typescript
// modules/faqs/dto/update-faq.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateFaqDto } from './create-faq.dto';

// → すべてのフィールドがオプショナルになる
export class UpdateFaqDto extends PartialType(CreateFaqDto) {}
```

```typescript
// modules/faqs/dto/search-faq.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsInt, Min, Max } from 'class-validator';

export class SearchFaqDto {
  @ApiProperty({ description: '検索クエリ' })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({ description: '類似度閾値 (0-1)', default: 0.75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;

  @ApiProperty({ description: '取得件数', default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}
```

### 5. AI Integration (Gemini + Langchain)

```typescript
// modules/ai/ai.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PromptTemplate } from '@langchain/core/prompts';
import { FaqsService } from '../faqs/faqs.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as prompts from './prompts';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI;
  private promptTemplates: Map<string, PromptTemplate>;

  constructor(
    private readonly faqsService: FaqsService,
    private readonly prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.promptTemplates = new Map();
    this.initializePrompts();
  }

  private initializePrompts() {
    this.promptTemplates.set('pet_shop', prompts.petShopPrompt);
    this.promptTemplates.set('beauty_salon', prompts.beautySalonPrompt);
    // 他の業種テンプレートをここに追加
  }

  async generateResponse(tenantId: string, userMessage: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new InternalServerErrorException('Tenant not found');
    }

    // FAQ検索 (RAG: Retrieval-Augmented Generation)
    const faqs = await this.faqsService.search(tenantId, {
      query: userMessage,
      threshold: 0.75,
      limit: 3,
    });

    const context =
      faqs.length > 0
        ? faqs.map((faq, i) => `${i + 1}. Q: ${faq.question}\n   A: ${faq.answer}`).join('\n\n')
        : '該当するFAQがありません。一般的な知識で回答してください。';

    const promptTemplate =
      this.promptTemplates.get(tenant.industry) ?? this.promptTemplates.get('pet_shop')!;

    const prompt = await promptTemplate.format({
      shopName: tenant.name,
      shopInfo: JSON.stringify(tenant.settings ?? {}, null, 2),
      context,
      question: userMessage,
    });

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3.0-flash-latest',
    });

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const confidence =
        faqs.length > 0
          ? faqs.reduce((sum, faq) => sum + faq.similarity, 0) / faqs.length
          : 0.5;

      return {
        content: text,
        usedFaqIds: faqs.map((faq) => faq.id),
        tokens: response.usageMetadata?.totalTokenCount ?? 0,
        confidence,
      };
    } catch (error) {
      this.logger.error('Gemini API call failed', error);
      throw new InternalServerErrorException('AI response generation failed');
    }
  }

  shouldEscalate(userMessage: string, confidence: number): boolean {
    const escalationKeywords = [
      'トラブル', '不具合', '返金', 'クレーム', '苦情', '怒', '最悪',
    ];
    const hasKeyword = escalationKeywords.some((kw) => userMessage.includes(kw));
    return hasKeyword || confidence < 0.6;
  }
}
```

### 6. プロンプトテンプレート例

```typescript
// modules/ai/prompts/pet-shop.ts

import { PromptTemplate } from '@langchain/core/prompts';

export const petShopPrompt = PromptTemplate.fromTemplate(`
あなたは「{shopName}」のペットショップスタッフです。
お客様からの質問に、親切で温かみのある対応を心がけてください。

【店舗情報】
{shopInfo}

【参考FAQ (類似度順)】
{context}

【お客様の質問】
{question}

【回答ルール】
1. ペットへの愛情を込めた言葉遣い
2. 専門用語は避け、初心者にも分かりやすく説明
3. 参考FAQに該当する内容があれば活用
4. 不確かな情報は「スタッフに直接確認させていただきます」と誘導
5. 緊急性の高い質問(病気・怪我)は「すぐに動物病院へ」と案内

【回答】
`);
```

### 7. WebSocket Gateway (リアルタイムチャット)

```typescript
// modules/chat/chat.gateway.ts

import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) {}

  async handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    const customerId = client.handshake.query.customerId as string;

    this.logger.log(`Client connected: ${client.id} | Tenant: ${tenantId}`);

    try {
      const session = await this.chatService.createSession(tenantId, customerId, 'web');
      client.data.sessionId = session.id;
      client.data.tenantId = tenantId;
      await client.join(`tenant:${tenantId}`);
    } catch (error) {
      this.logger.error('Error creating session', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    if (client.data.sessionId) {
      this.chatService.endSession(client.data.sessionId).catch(() => {});
    }
  }

  @SubscribeMessage('send_message')
  @UseGuards(WsJwtGuard)
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string },
  ) {
    const { sessionId, tenantId } = client.data;
    const { content } = data;

    try {
      await this.chatService.saveMessage(sessionId, 'user', content);

      const aiResponse = await this.aiService.generateResponse(tenantId, content);

      await this.chatService.saveMessage(sessionId, 'assistant', aiResponse.content, {
        faqIds: aiResponse.usedFaqIds,
        tokens: aiResponse.tokens,
        confidence: aiResponse.confidence,
      });

      client.emit('receive_message', {
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date().toISOString(),
        metadata: { confidence: aiResponse.confidence },
      });

      // エスカレーション判定
      if (this.aiService.shouldEscalate(content, aiResponse.confidence)) {
        this.server.to(`admin:${tenantId}`).emit('escalation_required', {
          sessionId,
          message: content,
          confidence: aiResponse.confidence,
        });
      }
    } catch (error) {
      this.logger.error('Error handling message:', error);
      client.emit('error', { message: 'メッセージ処理中にエラーが発生しました' });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { isTyping: boolean },
  ) {
    const tenantId = client.data.tenantId;
    client.to(`tenant:${tenantId}`).emit('user_typing', data);
  }
}
```

### 8. Error Handling (グローバルエラーフィルター)

```typescript
// common/filters/http-exception.filter.ts

import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as Record<string, unknown>).message as string ?? message;
        details = (exceptionResponse as Record<string, unknown>).details;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `${request.method} ${request.url} - ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### 9. Prisma Service (シングルトン + RLS Middleware)

```typescript
// prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async executeTransaction<T>(
    callback: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(callback);
  }
}
```

### 10. Caching Strategy (Redis)

```typescript
// modules/faqs/faqs.service.ts (キャッシュ追加パターン)

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class FaqsService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    // ...他の依存
  ) {}

  async findAll(tenantId: string, page = 1, limit = 20) {
    const cacheKey = `faqs:${tenantId}:${page}:${limit}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = /* ...DB query... */;

    // TTL: 5分 (300秒)
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }
}
```

---

## 🗄️ データベース設計

- **マルチテナント**: Row Level Security (RLS) + `tenant_id` カラム必須
- **Migration**: Prisma Migrate + `schema.prisma` から自動生成
- **pgvector**: FAQ埋め込みベクトル (1536次元、Gemini Embedding)
- **Indexing**: 必ず `EXPLAIN ANALYZE` で性能確認後にデプロイ
- **論理削除**: `is_active` フラグで論理削除、物理削除は原則禁止

---

## 🔒 セキュリティ

### 認証・認可

- **JWT**: Access Token (15分) + Refresh Token (7日間)
- **Passport**: `@nestjs/passport` + `passport-jwt` 戦略
- **Guards**: `@UseGuards(JwtAuthGuard)` で保護
- **RBAC**: `tenant_id` + `role` (admin, staff, user) によるアクセス制御
- **WebSocket**: `WsJwtGuard` で WebSocket 接続も認証必須

### Rate Limiting

- **Throttler**: `@nestjs/throttler` (10req/秒/IP)
- **API Key制限**: テナント毎に月間リクエスト上限

### OWASP Top 10 対策

| 脅威              | 対���                                             |
| ----------------- | ------------------------------------------------ |
| SQL Injection     | Prisma ORM（パラメータ化クエリ）で防御            |
| XSS               | API応答はJSON、HTML出力なし                       |
| CSRF              | SameSite Cookie + Stateless な API 設計           |
| Secrets 漏洩      | GCP Secret Manager + 環境変数での注入             |
| Broken Auth       | JWT + Refresh Token ローテーション               |

---

## 🧪 テスト戦略

| レイヤー            | ツール                                    | 対象                     |
| ------------------- | ----------------------------------------- | ------------------------ |
| **Unit Test**       | **Vitest** + `@nestjs/testing`            | Service、ユーティリティ  |
| **Integration Test**| Supertest + Testcontainers (PostgreSQL)   | API エンドポイント       |
| **E2E Test**        | Supertest + 実DB                          | ユーザーフロー全体       |
| **Coverage**        | 最低 80% カバレッジ目標                   | —                        |

### Unit Test 例 (Vitest)

```typescript
// modules/faqs/faqs.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FaqsService } from './faqs.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../ai/embeddings.service';

describe('FaqsService', () => {
  let service: FaqsService;
  let prisma: PrismaService;
  let embeddings: EmbeddingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FaqsService,
        {
          provide: PrismaService,
          useValue: {
            tenantFaq: {
              create: vi.fn(),
              findMany: vi.fn(),
              findFirst: vi.fn(),
              update: vi.fn(),
              updateMany: vi.fn(),
              count: vi.fn(),
            },
            $queryRaw: vi.fn(),
          },
        },
        {
          provide: EmbeddingsService,
          useValue: {
            generate: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
          },
        },
      ],
    }).compile();

    service = module.get<FaqsService>(FaqsService);
    prisma = module.get<PrismaService>(PrismaService);
    embeddings = module.get<EmbeddingsService>(EmbeddingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create FAQ with embedding', async () => {
      const mockFaq = {
        id: 'test-id',
        question: 'Test question',
        answer: 'Test answer',
        tenantId: 'tenant-id',
        embedding: [0.1, 0.2, 0.3],
      };

      vi.spyOn(prisma.tenantFaq, 'create').mockResolvedValue(mockFaq as never);

      const result = await service.create('tenant-id', {
        question: 'Test question',
        answer: 'Test answer',
      });

      expect(result).toEqual(mockFaq);
      expect(embeddings.generate).toHaveBeenCalledWith('Test question');
      expect(prisma.tenantFaq.create).toHaveBeenCalled();
    });
  });
});
```

### Integration Test 例

```typescript
// test/integration/faqs.integration.spec.ts

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('FAQs API (Integration)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /faqs - should create FAQ', async () => {
    const response = await request(app.getHttpServer())
      .post('/faqs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        question: '営業時間は?',
        answer: '10:00-19:00です',
        category: '店舗情報',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.question).toBe('営業時間は?');
  });
});
```

---

## ⚡ パフォーマンス

### Cloud Run 最適化

| 設定             | 値                              | 理由                        |
| ---------------- | ------------------------------- | --------------------------- |
| Min Instances    | `1`                             | コールドスタート防止         |
| Max Instances    | `10`                            | コスト抑制                   |
| CPU              | Always Allocated                | WebSocket/SSE 対応           |
| Memory           | 512MB (AI推論時は1GB)           | Gemini API レスポンス処理    |
| Concurrency      | 80                              | Node.js イベントループに適合 |

### キャッシング戦略

| 対象                | ストア   | TTL     |
| ------------------- | -------- | ------- |
| セッション           | Redis    | 24時間  |
| FAQ検索結果          | Redis    | 5分     |
| テナント設定         | Redis    | 15分    |
| HTTP レスポンス      | `Cache-Control` ヘッダー | リソース依存 |

### N+1 クエリ防止

- Prisma の `include` / `select` で必要な関連データのみ取得
- `EXPLAIN ANALYZE` でクエリプランを定期確認
- バッチ処理には `Promise.all()` / `$transaction` を活用

---

## 🚨 Common Pitfalls (AI エージェントが陥りやすい罠)

| ❌ やってはいけないこと | ✅ 正しいアプローチ |
| --- | --- |
| `IntrinsicException` を使用する | `HttpException` 系 (`NotFoundException`, `InternalServerErrorException` 等) を使用 |
| `any` 型を使用する | 明示的な型定義、`unknown` + 型ガードを使用 |
| エラーを `catch(() => {})` で握りつぶす | `Logger` で記録してから適切にハンドリング |
| `@Global()` を多用する | Feature Module 単位で `exports` / `imports` を管理 |
| N+1 クエリを放置する | `include` / `select` / バッチクエリを活用 |
| テスト内で `jest.fn()` を使う | NestJS 11 では `vi.fn()` (Vitest) を使用 |
| `.env` ファイルをコミットする | `.env.example` のみコミット、実値は Secret Manager |
| 同期的な重い処理を main thread で実行 | BullMQ ジョブキューに委譲 |
| Prisma `$queryRaw` で文字列結合 | テンプレートリテラル (自動パラメータ化) を使用 |

---

## 📞 Human Contact Protocol (Backend 固有)

以下の場合は**実装前に必ず人間に確認**してください:

- データベーススキーマの破壊���変更 (カラム削除、型変更)
- GCP API の新規有効化 (課金への影響)
- Gemini API の大量呼び出しパターン (コスト上昇リスク)
- セキュリティに関わる認証・認可ロジックの変更
- 新しい npm パッケージの追加 (セキュリティ/ライセンスリスク)
- マイクロサービス間通信のプロトコル変更
- Redis/キャッシュの TTL ポリシー変更

---

## ✅ Task Completion Checklist

タスク完了時、AIエージェントは以下を必ず確認してから報告すること:

- [ ] **ESLint エラーなし**: `pnpm lint`
- [ ] **TypeScript エラーなし**: `pnpm build` (SWC)
- [ ] **ユニットテスト追加 & 成功**: `pnpm test`
- [ ] **Swagger ドキュメント更新確認**: `/api/docs`
- [ ] **Prisma マイグレーション実行**: スキーマ変更時
- [ ] **環境変数 `.env.example` 更新**: 新しい環境変数追加時
- [ ] **エラーハンドリング実装**: 適切な `HttpException` を使用
- [ ] **ログ出力適切**: `Logger` を使用、JSON形式対応
- [ ] **パフォーマンス検証**: N+1 クエリチェック
- [ ] **セキュリティ**: JWT Guard 適用、テナント分離確認

---

**このファイルはバックエンド開発者（AI / 人間）のための「生きた憲法」です。技術スタックやベストプラクティスの更新に合わせて継続的に改訂してください。**
