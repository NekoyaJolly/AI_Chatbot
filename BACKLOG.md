# Development Backlog

## 🚨 重要プロトコル
**「人間の承認なしに次のタスクへ進むことを禁ずる」**
1. 実装完了・テスト実行後にコミット。
2. **人間に報告し、承認を待つ。**
3. 承認後に次のタスクに着手。

## 📊 Week 1: 技術検証 & 環境構築
- **[W1-001]** Turborepo Monorepo 初期化 (1pt)
- **[W1-002]** Supabase プロジェクト作成 & pgvector設定 (1pt)
- **[W1-003]** Prisma スキーマ初期定義 (2pt)
- **[W1-004]** Gemini API 動作確認スクリプト (1pt)
- **[W1-005]** pgvector セマンティック検索テスト (2pt)
- **[W1-006]** Next.js 15 プロジェクト初期化 (1pt)
- **[W1-007]** NestJS 10 プロジェクト初期化 (1pt)
- **[W1-008]** WebSocket (Socket.io) 基本動作確認 (2pt)

## 🎯 中長期ロードマップ
- **Week 2-4**: コアAPI実装（認証、FAQ CRUD等）
- **Month 2**: 多業種対応（プロンプトテンプレート化） & SaaS基盤強化
- **Month 3-6**: 埋め込みウィジェット、決済統合、スケーリング
BACKLOG.md 完全版 - 技術開発タスク78個 (投資家準備除く)
Copy---
version: 2.0.0
protocol: human_approval_required
last_updated: 2025-02-18
total_tasks: 78
focus: technical_implementation
---

# Development Backlog - Technical Implementation

## 🚨 重要プロトコル

**「人間の承認なしに次のタスクへ進むことを禁ずる」**

各タスク完了後:
1. 実装完了をコミット (`git commit -m "feat: タスク名"`)
2. 動作確認 (テスト実行 or 手動確認)
3. **🛑 人間に報告し、承認を待つ**
4. 承認後、次のタスクに着手

---

## 📊 タスクステータス定義

- `🔵 TODO`: 未着手
- `🟡 IN_PROGRESS`: 作業中
- `🟢 DONE`: 完了 (人間承認済み)
- `🔴 BLOCKED`: ブロック中 (依存タスク未完了)
- `⚪ SKIPPED`: スキップ (優先度変更)

---

## 🎯 Week 1: 技術検証 & 環境構築 (8タスク)

### [W1-001] 🔵 Turborepo Monorepo 初期化
**Estimate**: 1 point (30分)  
**Dependencies**: None  
**Priority**: P0 (最優先)

**Description**:
```bash
pnpm create turbo@latest chatbot-saas --example with-tailwind
cd chatbot-saas
git init
git remote add origin https://github.com/NekoyaJolly/AI_Chatbot
Copy
Acceptance Criteria:

 turbo.json 設定完了 (build/dev/lint パイプライン)
 pnpm-workspace.yaml 定義完了
 apps/web, apps/api, packages/database ディレクトリ存在
 .gitignore 更新 (node_modules, .env*, .turbo)
 初回コミット & プッシュ完了
Output:

GitHub リポジトリ初回プッシュ
README.md 更新
[W1-002] 🔵 Supabase プロジェクト作成 & pgvector設定
Estimate: 1 point (30分)
Dependencies: None
Priority: P0

Description:

Supabase Dashboard (https://supabase.com) でプロジェクト作成
SQL Editor で pgvector拡張インストール
接続文字列取得
SQL Commands:

Copy-- pgvector拡張インストール
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 日本語全文検索用

-- テスト用テーブル
CREATE TABLE test_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1536)
);

-- テストデータ挿入
INSERT INTO test_embeddings (content, embedding)
VALUES ('テストコンテンツ', '[0.1, 0.2, 0.3]');
Acceptance Criteria:

 Supabase プロジェクト作成完了
 プロジェクトURL取得 (例: https://xxx.supabase.co)
 Anon Key 取得
 Service Role Key 取得 (Secret Manager用)
 pgvector 拡張インストール確認 (\dx で確認)
 接続テスト成功 (psql or TablePlus)
Output:

.env.example に環境変数テンプレート追加:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
docs/SUPABASE_SETUP.md 作成
[W1-003] 🔵 Prisma スキーマ初期定義
Estimate: 2 points (1時間)
Dependencies: W1-002
Priority: P0

Description: packages/database/prisma/schema.prisma を作成し、以下のモデルを定義:

必須モデル (8個):

User - ユーザー
Tenant - テナント (企業/店舗)
TenantUser - ユーザー⇔テナント多対多
FaqTemplate - 業種別FAQテンプレート
TenantFaq - テナント個別FAQ
ChatSession - チャットセッション
ChatMessage - チャットメッセージ
TenantTemplate - チャットUI設定
スキーマ実装:

// packages/database/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

// ========================================
// User Model
// ========================================
model User {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String   @unique @db.VarChar(255)
  passwordHash  String?  @map("password_hash") @db.VarChar(255)
  name          String   @db.VarChar(255)
  avatar        String?  @db.VarChar(500)
  authProvider  String   @default("email") @db.VarChar(50)
  emailVerified DateTime? @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  
  tenants       TenantUser[]
  
  @@map("users")
  @@index([email])
}

// ========================================
// Tenant Model
// ========================================
model Tenant {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String   @db.VarChar(255)
  industry  String   @db.VarChar(50)
  plan      String   @db.VarChar(20) @default("light")
  status    String   @db.VarChar(20) @default("active")
  settings  Json?
  
  stripeCustomerId       String?   @unique @map("stripe_customer_id") @db.VarChar(255)
  stripeSubscriptionId   String?   @unique @map("stripe_subscription_id") @db.VarChar(255)
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  users         TenantUser[]
  faqs          TenantFaq[]
  chatSessions  ChatSession[]
  templates     TenantTemplate[]
  
  @@map("tenants")
  @@index([industry, status])
}

// ========================================
// TenantUser (Many-to-Many)
// ========================================
model TenantUser {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  role      String   @db.VarChar(50) @default("member")
  
  invitedAt DateTime @default(now()) @map("invited_at")
  joinedAt  DateTime @default(now()) @map("joined_at")
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, userId])
  @@map("tenant_users")
  @@index([tenantId, role])
}

// ========================================
// FaqTemplate (業種別テンプレート)
// ========================================
model FaqTemplate {
  id          String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  industry    String                     @db.VarChar(50)
  question    String                     @db.Text
  answer      String                     @db.Text
  category    String?                    @db.VarChar(100)
  embedding   Unsupported("vector(1536)")? // pgvector型
  usageCount  Int                        @default(0) @map("usage_count")
  
  createdAt   DateTime                   @default(now()) @map("created_at")
  updatedAt   DateTime                   @updatedAt @map("updated_at")
  
  @@map("faq_templates")
  @@index([industry, category])
}

// ========================================
// TenantFaq (テナント個別FAQ)
// ========================================
model TenantFaq {
  id        String                     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId  String                     @map("tenant_id") @db.Uuid
  question  String                     @db.Text
  answer    String                     @db.Text
  category  String?                    @db.VarChar(100)
  embedding Unsupported("vector(1536)")?
  isActive  Boolean                    @default(true) @map("is_active")
  
  clickCount    Int      @default(0) @map("click_count")
  positiveVotes Int      @default(0) @map("positive_votes")
  negativeVotes Int      @default(0) @map("negative_votes")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("tenant_faqs")
  @@index([tenantId, isActive])
}

// ========================================
// ChatSession
// ========================================
model ChatSession {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String    @map("tenant_id") @db.Uuid
  customerId  String?   @map("customer_id") @db.VarChar(255)
  channel     String    @db.VarChar(20)
  
  startedAt   DateTime  @default(now()) @map("started_at")
  endedAt     DateTime? @map("ended_at")
  duration    Int?
  
  csatScore   Int?      @map("csat_score") @db.SmallInt
  feedback    String?   @db.Text
  
  isEscalated Boolean   @default(false) @map("is_escalated")
  escalatedAt DateTime? @map("escalated_at")
  
  tenant      Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  messages    ChatMessage[]
  
  @@map("chat_sessions")
  @@index([tenantId, startedAt])
  @@index([customerId])
}

// ========================================
// ChatMessage
// ========================================
model ChatMessage {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  role      String   @db.VarChar(20)
  content   String   @db.Text
  metadata  Json?
  tokens    Int?
  
  createdAt DateTime @default(now()) @map("created_at")
  
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  @@map("chat_messages")
  @@index([sessionId, createdAt])
}

// ========================================
// TenantTemplate
// ========================================
model TenantTemplate {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  tenantId    String   @map("tenant_id") @db.Uuid
  name        String   @db.VarChar(255)
  description String?  @db.Text
  config      Json
  isActive    Boolean  @default(true) @map("is_active")
  
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("tenant_templates")
  @@index([tenantId, isActive])
}
Acceptance Criteria:

 全8モデル定義完了
 pgvector型を Unsupported("vector(1536)") で定義
 pnpm prisma generate 成功
 pnpm prisma migrate dev --name init 実行成功
 Supabase でテーブル作成確認 (8テーブル)
 インデックス作成確認
Output:

packages/database/prisma/schema.prisma
packages/database/prisma/migrations/ 初回マイグレーション
packages/database/node_modules/.prisma/client 生成
[W1-004] 🔵 Gemini API動作確認スクリプト
Estimate: 1 point (30分)
Dependencies: None
Priority: P0

Description: Gemini 3.0 Flash の基本動作を確認するスクリプトを作成。

実装:

Copycd packages/database
pnpm add @google/generative-ai
Copy// packages/database/scripts/test-gemini.ts

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function testGemini() {
  console.log('🧪 Gemini 3.0 Flash 動作確認テスト\n');

  const model = genAI.getGenerativeModel({ model: "gemini-3.0-flash-latest" });
  
  const testCases = [
    {
      name: "基本応答テスト",
      prompt: "ペットショップの営業時間を聞かれた場合、どのように答えればよいですか？",
    },
    {
      name: "日本語精度テスト",
      prompt: "犬のトイレトレーニングについて、初心者に分かりやすく説明してください。",
    },
    {
      name: "長文生成テスト",
      prompt: "ペットショップで扱う犬種トップ5を紹介し、それぞれの特徴を200文字以内で説明してください。",
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 ${testCase.name}`);
    console.log(`プロンプト: ${testCase.prompt}`);
    
    const startTime = Date.now();
    
    try {
      const result = await model.generateContent(testCase.prompt);
      const response = result.response;
      const text = response.text();
      
      const elapsed = Date.now() - startTime;
      
      console.log(`✅ 応答成功 (${elapsed}ms)`);
      console.log(`📊 トークン使用量: ${response.usageMetadata?.totalTokenCount || 'N/A'}`);
      console.log(`💬 応答:\n${text.substring(0, 200)}...\n`);
      
      // パフォーマンス評価
      if (elapsed < 2000) {
        console.log(`⚡ 高速 (<2秒)`);
      } else if (elapsed < 3000) {
        console.log(`🟡 やや遅い (2-3秒)`);
      } else {
        console.log(`🔴 遅い (>3秒)`);
      }
    } catch (error) {
      console.error(`❌ エラー:`, error);
    }
  }
  
  console.log('\n✅ テスト完了');
}

testGemini().catch(console.error);
Copy
Acceptance Criteria:

 スクリプト実行成功 (pnpm tsx scripts/test-gemini.ts)
 3つのテストケースすべて成功
 平均応答時間 <3秒
 日本語応答確認
 トークン使用量表示
Output:

packages/database/scripts/test-gemini.ts
実行ログを docs/WEEK1_GEMINI_TEST.md に保存
[W1-005] 🔵 pgvector セマンティック検索テスト
Estimate: 2 points (1時間)
Dependencies: W1-002, W1-003, W1-004
Priority: P0

Description: FAQ 10問を登録し、セマンティック検索で類似質問を取得するテストスクリプト。

実装:

Copy// packages/database/scripts/test-pgvector.ts

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

async function testPgVector() {
  console.log('🧪 pgvector セマンティック検索テスト開始\n');

  // テストFAQ 10問
  const testFaqs = [
    { q: '営業時間は何時から何時までですか?', a: '平日10:00-19:00、土日10:00-18:00です', cat: '店舗情報' },
    { q: '駐車場はありますか?', a: '店舗前に3台分の駐車スペースがあります', cat: '店舗情報' },
    { q: '予約は必要ですか?', a: 'トリミングは予約制です。ご来店は予約不要です', cat: '店舗情報' },
    { q: '子犬のトイレトレーニング方法を教えてください', a: 'サークル内にトイレシートを敷き、排泄のタイミングを見計らって誘導します', cat: '飼育サポート' },
    { q: '初心者におすすめの犬種は?', a: 'トイプードル、ゴールデンレトリバー、柴犬が飼いやすいです', cat: 'ペット選び' },
    { q: 'ペット保険は必要ですか?', a: '医療費の備えとして加入をおすすめします', cat: '購入手続き' },
    { q: 'フードの選び方を教えてください', a: '年齢、体重、健康状態に合わせて選びます。無料相談も可能です', cat: '商品・サービス' },
    { q: '夜鳴きの対処法は?', a: '環境に慣れるまで1週間程度かかります。寂しさを軽減する工夫をしてください', cat: '飼育サポート' },
    { q: 'ワクチン接種のスケジュールは?', a: '生後2ヶ月、3ヶ月、1年後に接種が必要です', cat: '購入手続き' },
    { q: 'トリミングの料金は?', a: '犬種・サイズにより異なります。小型犬¥5,000〜、中型犬¥8,000〜', cat: '商品・サービス' },
  ];

  console.log('📝 テストFAQ 10問を登録中...\n');

  // Embedding生成 & 登録
  for (const faq of testFaqs) {
    const embedding = await generateEmbedding(faq.q);
    
    await prisma.$executeRaw`
      INSERT INTO faq_templates (industry, question, answer, category, embedding)
      VALUES ('pet_shop', ${faq.q}, ${faq.a}, ${faq.cat}, ${embedding}::vector)
    `;
    
    console.log(`✅ 登録: ${faq.q}`);
  }

  console.log('\n🔍 セマンティック検索テスト開始\n');

  // 検索テストケース (類義語・口語表現)
  const searchQueries = [
    { query: 'お店は何時まで開いてますか?', expected: '営業時間' },
    { query: '駐車できる場所はある?', expected: '駐車場' },
    { query: '犬のおしっこトレーニング', expected: 'トイレトレーニング' },
    { query: '初めて犬を飼うのですが', expected: '初心者におすすめ' },
    { query: '子犬が夜泣く', expected: '夜鳴き' },
  ];

  for (const test of searchQueries) {
    console.log(`🔍 検索クエリ: "${test.query}"`);

    const queryEmbedding = await generateEmbedding(test.query);

    const results = await prisma.$queryRaw<any[]>`
      SELECT 
        question,
        answer,
        category,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM faq_templates
      WHERE industry = 'pet_shop'
        AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.7
      ORDER BY similarity DESC
      LIMIT 3
    `;

    console.log('📊 検索結果:');
    results.forEach((r, i) => {
      const similarityPercent = (r.similarity * 100).toFixed(1);
      console.log(`  ${i + 1}. [類似度: ${similarityPercent}%] ${r.question}`);
      console.log(`     [カテゴリ: ${r.category}]`);
      console.log(`     → ${r.answer}\n`);
    });

    // 期待値チェック
    const topResult = results[0];
    if (topResult && topResult.question.includes(test.expected)) {
      console.log(`✅ 期待通りの結果\n`);
    } else {
      console.log(`⚠️  期待と異なる結果\n`);
    }
  }

  // パフォーマンステスト
  console.log('⚡ パフォーマンステスト (100件FAQ想定)\n');
  
  const perfStart = Date.now();
  const perfQuery = await generateEmbedding('営業時間');
  await prisma.$queryRaw`
    SELECT question, answer
    FROM faq_templates
    WHERE industry = 'pet_shop'
    ORDER BY embedding <=> ${perfQuery}::vector
    LIMIT 5
  `;
  const perfElapsed = Date.now() - perfStart;
  
  console.log(`検索速度: ${perfElapsed}ms`);
  
  if (perfElapsed < 100) {
    console.log(`✅ 高速 (<100ms)`);
  } else {
    console.log(`⚠️  やや遅い (>100ms) - インデックス最適化が必要`);
  }

  await prisma.$disconnect();
  
  console.log('\n✅ テスト完了');
}

testPgVector().catch(console.error);
Copy
Acceptance Criteria:

 テストFAQ 10問登録成功
 5つの検索クエリすべて成功
 類似度70%以上でFAQマッチング
 「営業時間」「駐車場」等の類義語検出成功
 検索速度 <100ms (10件FAQ時)
 日本語の口語表現に対応
Output:

packages/database/scripts/test-pgvector.ts
検証結果レポート (docs/WEEK1_PGVECTOR_VERIFICATION.md)
[W1-006] 🔵 Next.js 15 プロジェクト初期化
Estimate: 1 point (30分)
Dependencies: W1-001
Priority: P0

Description:

Copycd apps/web

# 依存関係インストール
pnpm add next@15 react@19 react-dom@19
pnpm add -D @types/react @types/react-dom typescript

# shadcn/ui 初期化
pnpm dlx shadcn-ui@latest init
# 選択: Default, Slate, CSS variables: Yes

# 基本コンポーネント追加
pnpm dlx shadcn-ui@latest add button input card
app/page.tsx 作成:

Copy// apps/web/app/page.tsx

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>AI Chatbot SaaS</CardTitle>
          <CardDescription>Week 1 技術検証</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Next.js 15 + shadcn/ui 動作確認
          </p>
          <Button className="w-full">動作確認</Button>
        </CardContent>
      </Card>
    </main>
  )
}
Acceptance Criteria:

 pnpm dev で起動確認 (http://localhost:3000)
 Tailwind CSS 動作確認
 shadcn/ui Button コンポーネント表示確認
 TypeScript エラーなし
 ホットリロード動作確認
Output:

apps/web/app/page.tsx
apps/web/components/ui/button.tsx
apps/web/tailwind.config.ts
[W1-007] 🔵 NestJS 10 プロジェクト初期化
Estimate: 1 point (30分)
Dependencies: W1-001
Priority: P0

Description:

Copycd apps/api

# 依存関係インストール
pnpm add @nestjs/common@10 @nestjs/core@10 @nestjs/platform-express
pnpm add @nestjs/config @nestjs/swagger
pnpm add -D @nestjs/cli @types/node typescript
main.ts 作成:

Copy// apps/api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // グローバルバリデーション
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 設定
  const config = new DocumentBuilder()
    .setTitle('Chatbot SaaS API')
    .setDescription('AI Chatbot SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`✅ NestJS API running on http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
}
bootstrap();
Copy
app.module.ts 作成:

Copy// apps/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
app.controller.ts 作成:

Copy// apps/api/src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
Acceptance Criteria:

 pnpm start:dev で起動確認 (http://localhost:4000)
 Swagger UI 表示 (http://localhost:4000/api/docs)
 ヘルスチェック /health 200 OK
 CORS設定確認 (Next.js から接続可能)
 TypeScript エラーなし
Output:

apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/app.controller.ts
apps/api/src/app.service.ts
[W1-008] 🔵 WebSocket 基本動作確認
Estimate: 2 points (1時間)
Dependencies: W1-007
Priority: P0

Description: Socket.io で簡単なEchoサーバーを実装。

Backend実装:

Copycd apps/api
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
Copy// apps/api/src/chat/chat.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string,
  ): string {
    this.logger.log(`Message received: ${payload}`);
    return `Echo: ${payload}`;
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): string {
    return 'pong';
  }
}
Copy
Frontend実装:

Copycd apps/web
pnpm add socket.io-client
Copy// apps/web/lib/socket.ts

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      autoConnect: false,
    });
  }
  return socket;
}
Copy// apps/web/app/test-websocket/page.tsx

"use client"

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestWebSocketPage() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      console.log('✅ Connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setConnected(false);
    });

    socket.on('message', (data: string) => {
      console.log('📨 Received:', data);
      setMessages((prev) => [...prev, data]);
    });

    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('message');
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const socket = getSocket();
    socket.emit('message', message);
    setMessages((prev) => [...prev, `You: ${message}`]);
    setMessage('');
  };

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>WebSocket テスト</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {connected ? '接続中' : '切断'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 overflow-y-auto border rounded p-4 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                {msg}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="メッセージを入力..."
              disabled={!connected}
            />
            <Button onClick={sendMessage} disabled={!connected}>
              送信
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
Copy
Acceptance Criteria:

 WebSocket接続確立成功
 Echoメッセージ送受信成功
 遅延 <100ms
 接続状態インジケーター動作
 切断→再接続 動作確認
 コンソールログ出力確認
Output:

apps/api/src/chat/chat.gateway.ts
apps/web/lib/socket.ts
apps/web/app/test-websocket/page.tsx
📊 Week 1 完了チェックリスト
Week 1 (8タスク) 完了時、以下を確認:

 すべてのタスクが 🟢 DONE ステータス
 GitHub に Week1 ブランチマージ済み
 docs/WEEK1_VERIFICATION.md 作成済み
Copy# Week 1 検証結果レポート

## 完了タスク: 8/8

### 技術検証結果
- pgvector セマンティック検索: 精度97% ✅
- Gemini API応答速度: 平均1.2秒 ✅
- WebSocket遅延: 平均85ms ✅

### 環境構築状況
- Supabase プロジェクト: 稼働中 ✅
- Prisma マイグレーション: 8テーブル作成完了 ✅
- Next.js / NestJS: ローカル起動確認 ✅
 memory-bank/progress/week-1-summary.md 作成済み
 Week 2 着手承認取得
🎯 Week 2: 認証 & FAQ CRUD実装 (14タスク)
[W2-001] 🔵 NextAuth.js v5 認証設定
Estimate: 3 points (1.5時間)
Dependencies: W1-006
Priority: P0

Description: NextAuth.js v5 でメール/パスワード認証 + Google OAuth を実装。

実装:

Copycd apps/web
pnpm add next-auth@beta @auth/prisma-adapter bcrypt
pnpm add -D @types/bcrypt
Copy// apps/web/app/api/auth/[...nextauth]/route.ts

import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("メールアドレスとパスワードを入力してください")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            tenants: {
              include: { tenant: true },
              where: { tenant: { status: "active" } }
            }
          }
        })

        if (!user || !user.passwordHash) {
          throw new Error("メールアドレスまたはパスワードが正しくありません")
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!isValid) {
          throw new Error("メールアドレスまたはパスワードが正しくありません")
        }

        const defaultTenant = user.tenants.find(t => t.role === "owner")?.tenant || user.tenants[0]?.tenant

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          tenantId: defaultTenant?.id,
          tenantName: defaultTenant?.name,
          role: user.tenants[0]?.role
        }
      }
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.tenantId = user.tenantId
        token.tenantName = user.tenantName
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.tenantId = token.tenantId as string
        session.user.tenantName = token.tenantName as string
        session.user.role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
Copy
Acceptance Criteria:

 NextAuth 設定完了
 メール/パスワード認証動作
 Google OAuth 動作 (開発環境)
 JWT トークン生成確認
 セッション永続化確認
 ログイン/ログアウト動作確認
Output:

apps/web/app/api/auth/[...nextauth]/route.ts
apps/web/types/next-auth.d.ts (型定義拡張)
.env.example に環境変数追加
[W2-002] 🔵 ログイン/サインアップページUI実装
Estimate: 2 points (1時間)
Dependencies: W2-001
Priority: P0

Description: shadcn/ui を使ったログイン & サインアップページ実装。

実装ファイル:

apps/web/app/(auth)/login/page.tsx
apps/web/app/(auth)/signup/page.tsx
apps/web/app/(auth)/layout.tsx
(詳細実装は先ほど提供済み)

Acceptance Criteria:

 ログインページ表示
 サインアップページ表示
 バリデーションエラー表示
 Google OAuth ボタン動作
 レスポンシブデザイン確認
 Lighthouse スコア >90
Output:

ログイン/サインアップページ完成
中央配置レイアウト
[W2-003] 🔵 NestJS 認証モジュール実装
Estimate: 3 points (1.5時間)
Dependencies: W2-001
Priority: P0

Description: NestJS側で登録API + JWT認証ガードを実装。

実装:

Copycd apps/api
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
pnpm add -D @types/passport-jwt @types/bcrypt
Copy// apps/api/src/modules/auth/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    
    if (existing) {
      throw new UnauthorizedException('このメールアドレスは既に登録されています');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        authProvider: 'email',
      },
    });

    const tenant = await this.prisma.tenant.create({
      data: {
        name: `${dto.name}のワークスペース`,
        industry: dto.industry || 'general',
        plan: 'light',
        users: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
    });

    const token = this.generateToken(user.id, tenant.id);

    return {
      user: this.sanitizeUser(user),
      tenant,
      token,
    };
  }

  private generateToken(userId: string, tenantId: string) {
    return this.jwtService.sign({
      sub: userId,
      tenantId,
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
Copy
Acceptance Criteria:

 /auth/register エンドポイント動作
 パスワードハッシュ化確認 (bcrypt)
 テナント自動作成確認
 JWT トークン発行確認
 Swagger ドキュメント生成
Output:

apps/api/src/modules/auth/ モジュール完成
[W2-004] 🔵 JWT認証ガード実装
Estimate: 2 points (1時間)
Dependencies: W2-003
Priority: P0

Description: 全APIエンドポイントで使用するJWT認証ガードを実装。

実装:

Copy// apps/api/src/common/guards/jwt-auth.guard.ts

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
Copy// apps/api/src/modules/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; tenantId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenants: {
          where: { tenantId: payload.tenantId },
          include: { tenant: true },
        },
      },
    });

    if (!user || user.tenants.length === 0) {
      throw new UnauthorizedException();
    }

    return {
      ...user,
      currentTenant: user.tenants[0].tenant,
      role: user.tenants[0].role,
    };
  }
}
Copy
Acceptance Criteria:

 JWT Strategy 動作確認
 認証必須エンドポイントで401エラー
 有効なトークンで認証成功
 @CurrentUser() デコレーター動作
Output:

JWT認証ガード完成
カスタムデコレーター実装
[W2-005] 🔵 FAQ CRUD API実装 (NestJS)
Estimate: 4 points (2時間)
Dependencies: W1-003, W2-004
Priority: P0

Description: FAQ の作成・読取・更新・削除APIを実装。

実装ファイル:

apps/api/src/modules/faqs/faqs.controller.ts
apps/api/src/modules/faqs/faqs.service.ts
apps/api/src/modules/faqs/dto/
(詳細実装は先ほど提供済み)

API Endpoints:

POST   /faqs              # FAQ作成
GET    /faqs              # 一覧取得
GET    /faqs/:id          # 詳細取得
PUT    /faqs/:id          # 更新
DELETE /faqs/:id          # 削除
POST   /faqs/search       # セマンティック検索
POST   /faqs/bulk-import  # CSV一括インポート
Acceptance Criteria:

 全7エンドポイント実装完了
 JWT認証必須設定
 テナント分離動作確認
 バリデーション動作 (class-validator)
 Swagger ドキュメント生成
 ユニットテスト追加 (カバレッジ>70%)
Output:

FAQモジュール完成
Swagger UIでAPI確認可能
[W2-006] 🔵 Embedding自動生成サービス実装
Estimate: 2 points (1時間)
Dependencies: W1-004, W2-005
Priority: P0

Description: Gemini Embedding API を使ったEmbedding自動生成サービス。

実装:

Copy// apps/api/src/modules/ai/embeddings.service.ts

import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EmbeddingsService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  async generate(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  async generateBatch(texts: string[]): Promise<number[][]> {
    const promises = texts.map(text => this.generate(text));
    return Promise.all(promises);
  }
}
Acceptance Criteria:

 単一テキストのEmbedding生成成功
 バッチ処理動作確認 (10件同時)
 エラーハンドリング実装
 レート制限対策 (必要に応じて)
Output:

apps/api/src/modules/ai/embeddings.service.ts
[W2-007] 🔵 FAQ管理画面UI実装 (Next.js)
Estimate: 4 points (2時間)
Dependencies: W2-002, W2-005
Priority: P0

Description: FAQ一覧・作成・編集画面を shadcn/ui で実装。

実装ファイル:

apps/web/app/(dashboard)/faqs/page.tsx (一覧)
apps/web/app/(dashboard)/faqs/new/page.tsx (作成)
apps/web/app/(dashboard)/faqs/[id]/page.tsx (編集)
apps/web/components/faq/faq-list.tsx
apps/web/components/faq/faq-form.tsx
apps/web/hooks/use-faqs.ts (React Query)
機能要件:

一覧表示 (ページネーション、カテゴリフィルター)
作成フォーム (質問・回答・カテゴリ)
編集フォーム (既存データ読み込み)
削除確認ダイアログ
リアルタイム更新 (React Query)
Acceptance Criteria:

 FAQ一覧表示成功 (20件/ページ)
 FAQ作成成功 (バリデーションエラー表示)
 FAQ編集成功
 FAQ削除成功 (確認ダイアログ)
 カテゴリフィルター動作
 レスポンシブデザイン確認
Output:

FAQ管理画面完成
[W2-008] 🔵 FAQ検索UI実装
Estimate: 2 points (1時間)
Dependencies: W2-005, W2-007
Priority: P1

Description: セマンティック検索UIを実装。

実装:

Copy// apps/web/components/faq/faq-search.tsx

"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { searchFaqs } from '@/lib/api-client'

export function FaqSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    try {
      const data = await searchFaqs(query)
      setResults(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="FAQ検索..."
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          検索
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((result: any) => (
          <Card key={result.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{result.question}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.answer}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                類似度: {(result.similarity * 100).toFixed(0)}%
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
Copy
Acceptance Criteria:

 検索ボックス表示
 セマンティック検索実行成功
 類似度スコア表示
 結果0件時のメッセージ表示
 ローディング状態表示
Output:

FAQ検索コンポーネント完成
[W2-009] 🔵 CSV一括インポート機能実装
Estimate: 2 points (1時間)
Dependencies: W2-005
Priority: P1

Description: CSVファイルからFAQを一括インポートする機能。

CSV Format:

question,answer,category
営業時間は?,平日10:00-19:00です,店舗情報
駐車場はありますか?,店舗前に3台分あります,店舗情報
実装:

Copy// apps/web/components/faq/faq-import.tsx

"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useDropzone } from 'react-dropzone'
import { parse } from 'csv-parse/browser/esm'
import { bulkImportFaqs } from '@/lib/api-client'

export function FaqImport() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
    },
  })

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      const text = await file.text()
      const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
      })

      const faqs = []
      for await (const record of records) {
        faqs.push({
          question: record.question,
          answer: record.answer,
          category: record.category || undefined,
        })
      }

      await bulkImportFaqs(faqs)
      alert(`${faqs.length}件のFAQをインポートしました`)
      setFile(null)
    } catch (error) {
      alert('インポートに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary"
      >
        <input {...getInputProps()} />
        {file ? (
          <p>選択: {file.name}</p>
        ) : (
          <p>CSVファイルをドラッグ&ドロップ</p>
        )}
      </div>

      <Button onClick={handleImport} disabled={!file || loading}>
        インポート
      </Button>
    </div>
  )
}
Copy
Acceptance Criteria:

 CSV読み込み成功
 パース処理成功
 バルクインポートAPI呼び出し成功
 エラーハンドリング
 進捗表示
Output:

CSV一括インポート機能完成
[W2-010] 🔵 Row Level Security (RLS) 実装
Estimate: 2 points (1時間)
Dependencies: W1-003, W2-004
Priority: P0

Description: Prisma Middleware でテナントデータ分離を実装。

実装:

Copy// apps/api/src/prisma/prisma.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

export const asyncLocalStorage = new AsyncLocalStorage<{ tenantId: string }>();

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Middleware: テナント分離
    this.$use(async (params, next) => {
      const tenantModels = ['TenantFaq', 'ChatSession', 'ChatMessage'];

      if (tenantModels.includes(params.model || '')) {
        const store = asyncLocalStorage.getStore();
        const tenantId = store?.tenantId;

        if (tenantId) {
          if (params.action === 'findMany' || params.action === 'findFirst') {
            params.args.where = {
              ...params.args.where,
              tenantId,
            };
          }
        }
      }

      return next(params);
    });
  }

  // AsyncLocalStorage ヘルパー
  async runInTenantContext<T>(tenantId: string, callback: () => Promise<T>): Promise<T> {
    return asyncLocalStorage.run({ tenantId }, callback);
  }
}
Copy
Acceptance Criteria:

 Middleware動作確認
 テナントAがテナントBのデータを取得できない
 全CRUD操作でRLS適用確認
 パフォーマンス影響確認 (<10%劣化)
Output:

RLS実装完了
[W2-011] 🔵 ダッシュボードレイアウト実装
Estimate: 3 points (1.5時間)
Dependencies: W2-002
Priority: P0

Description: サイドバー + ヘッダーのダッシュボードレイアウト実装。

(実装は先ほど提供済み)

Acceptance Criteria:

 サイドバーナビゲーション動作
 アクティブ状態表示
 ヘッダーユーザーメニュー動作
 レスポンシブ (モバイルメニュー)
 ログアウト機能動作
Output:

ダッシュボードレイアウト完成
[W2-012] 🔵 ダッシュボードホーム画面実装
Estimate: 2 points (1時間)
Dependencies: W2-011
Priority: P1

Description: 統計カード + 最近のアクティビティ表示。

実装:

Copy// apps/web/app/(dashboard)/page.tsx

import { StatsCard } from '@/components/dashboard/stats-card'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { getStats } from '@/lib/api-client'

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">ダッシュボード</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="今日のチャット"
          value={stats.todayChats}
          trend="+12%"
          icon="MessageSquare"
        />
        <StatsCard
          title="FAQ数"
          value={stats.totalFaqs}
          icon="HelpCircle"
        />
        <StatsCard
          title="正答率"
          value={`${stats.accuracyRate}%`}
          icon="CheckCircle"
        />
        <StatsCard
          title="平均応答時間"
          value={`${stats.avgResponseTime}s`}
          icon="Clock"
        />
      </div>

      <RecentActivity />
    </div>
  )
}
Copy
Acceptance Criteria:

 統計カード表示
 データフェッチ成功
 最近のアクティビティ表示
 レスポンシブデザイン
Output:

ダッシュボードホーム完成
[W2-013] 🔵 エラーハンドリング統一実装
Estimate: 2 points (1時間)
Dependencies: W2-003
Priority: P1

Description: グローバルエラーフィルター + エラーログ実装。

(実装は先ほど提供済み)

Acceptance Criteria:

 グローバルエラーフィルター動作
 エラーレスポンス統一形式
 エラーログ出力 (Sentry準備)
 400/401/403/404/500 エラーハンドリング
Output:

エラーハンドリング統一完了
[W2-014] 🔵 E2Eテスト基盤構築
Estimate: 2 points (1時間)
Dependencies: W2-002, W2-007
Priority: P2

Description: Playwright で E2E テスト環境構築。

実装:

Copycd apps/web
pnpm add -D @playwright/test
pnpm dlx playwright install
Copy// apps/web/tests/e2e/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(page.locator('text=ダッシュボード')).toBeVisible();
  });
});
Acceptance Criteria:

 Playwright設定完了
 ログインE2Eテスト成功
 FAQ作成E2Eテスト成功
 CI/CDパイプライン統合準備
Output:

E2Eテスト基盤完成
📊 Week 2 完了チェックリスト
 すべてのタスク (14個) が 🟢 DONE
 認証機能完全動作 (ログイン/サインアップ/ログアウト)
 FAQ CRUD API 動作確認
 FAQ管理画面完成
 RLS実装 & テナント分離確認
 memory-bank/progress/week-2-summary.md 作成
 Week 3 着手承認取得
🎯 Week 3: チャット機能実装 (14タスク)
[W3-001] 🔵 AI応答生成サービス実装
Estimate: 4 points (2時間)
Dependencies: W2-005, W2-006
Priority: P0

Description: Gemini API + Langchain でAI応答生成サービスを実装。

(実装は先ほど提供済み)

Acceptance Criteria:

 FAQ検索 → LLM推論 → 応答生成成功
 業種別プロンプト適用確認
 信頼度スコア計算
 エスカレーション判定動作
 応答速度 <2秒
Output:

AIサービス完成
[W3-002] 🔵 プロンプトテンプレート作成
Estimate: 2 points (1時間)
Dependencies: W3-001
Priority: P0

Description: 3業種分のプロンプトテンプレートを作成。

業種:

ペットショップ
美容サロン
動物病院
Acceptance Criteria:

 3業種のプロンプト作成完了
 Langchain PromptTemplate形式
 トーン & マナー設定
 回答ルール定義
Output:

apps/api/src/modules/ai/prompts/ 3ファイル
[W3-003] 🔵 WebSocket Gateway完全実装
Estimate: 3 points (1.5時間)
Dependencies: W1-008, W3-001
Priority: P0

Description: 本番用WebSocket Gatewayを実装。

(実装は先ほど提供済み)

Acceptance Criteria:

 セッション管理動作
 メッセージ送受信成功
 AI応答生成統合
 エスカレーション通知動作
 複数クライアント同時接続テスト
Output:

WebSocket Gateway完成
[W3-004] 🔵 チャット履歴保存実装
Estimate: 2 points (1時間)
Dependencies: W3-003
Priority: P0

Description: ChatSession & ChatMessage の保存処理実装。

実装:

Copy// apps/api/src/modules/chat/chat.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createSession(tenantId: string, customerId: string, channel: string) {
    return this.prisma.chatSession.create({
      data: {
        tenantId,
        customerId,
        channel,
      },
    });
  }

  async saveMessage(sessionId: string, role: string, content: string, metadata?: any) {
    return this.prisma.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        metadata,
      },
    });
  }

  async endSession(sessionId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: true },
    });

    if (!session) return;

    const duration = Math.floor((new Date().getTime() - session.startedAt.getTime()) / 1000);

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        duration,
      },
    });
  }
}
Copy
Acceptance Criteria:

 セッション作成成功
 メッセージ保存成功
 セッション終了処理成功
 継続時間計算正確
Output:

チャット履歴保存サービス完成
[W3-005] 🔵 チャットUIコンポーネント実装
Estimate: 4 points (2時間)
Dependencies: W3-003
Priority: P0

Description: リアルタイムチャットUIコンポーネント実装。

実装:

Copy// apps/web/components/chat/chat-window.tsx

"use client"

import { useEffect, useState } from 'react'
import { useChat } from '@/hooks/use-chat'
import { ChatMessage } from './chat-message'
import { ChatInput } from './chat-input'
import { Card } from '@/components/ui/card'

export function ChatWindow({ tenantId }: { tenantId: string }) {
  const { messages, sendMessage, isConnected } = useChat(tenantId)

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">チャット</h3>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-muted-foreground">
            {isConnected ? '接続中' : '切断'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <ChatMessage key={i} message={message} />
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <ChatInput onSend={sendMessage} disabled={!isConnected} />
      </div>
    </Card>
  )
}
Copy
Acceptance Criteria:

 メッセージ表示成功
 リアルタイム更新動作
 スクロール自動追従
 入力欄動作
 接続状態表示
Output:

チャットUIコンポーネント完成
