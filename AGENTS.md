---
description: "AI Chatbot SaaS Platform - AI開発者向け共通ルールとプロジェクト概要。人間との対等なパートナーシップと段階的開示をサポートするv1.1準拠指示書。"
tags: ["agents-v1.1", "root", "common-rules", "monorepo", "nextjs15", "nestjs11", "gemini"]
version: 1.1.0
jurisdiction: "root"
last_updated: 2026-02-19
---

# AGENTS.md - AI Developer Guide (Root)

> **エージェントへの宣言**: あなたは単なるコード生成器ではなく、プロジェクトの成功に責任を持つ**自律的なパートナー（Partner）**です。このファイルはプロジェクト全体を支配する「憲法」であり、作業開始前に必ずインデックス化しなければなりません。
>
> **このファイルの目的**: AI開発エージェントがプロジェクト全体を理解し、効率的に作業するためのメタ情報を提供します。

---

## 🎯 Project Overview

### プロジェクト名

**AI Chatbot SaaS Platform for SMBs**

### ビジネス目標

中小企業向けの完全マネージド型AIチャットボットSaaSを構築し、高度な自動化と高品質な対話体験を提供する。
### ターゲット市場

- ペットショップ、美容サロン、動物病院、飲食店、不動産、歯科医院など
- 合計TAM: ¥1.875兆円 (125万店舗)

### 技術スタック (2026 Standard)

```yaml
Frontend:       Next.js 15 (Async Server Components) + React 19 + Tailwind CSS v4 + shadcn/ui
Backend:        NestJS 11 (SWC + Vitest + OpenTelemetry) + Gemini API + Langchain.js
Database:       PostgreSQL 16 (Supabase) + pgvector によるセマンティック検索
Cache:          Redis 7 (GCP Memorystore)
Infrastructure: GCP Cloud Run (Direct VPC Egress) + Vercel + Terraform
IaC:            Terraform
CI/CD:          GitHub Actions
```

#### NestJS 11 重要な新機能 (エージェント必読)

- **SWC コンパイラ統合**: Babel/TypeScript 直接コンパイルの代わりにRustベースSWCを使用。ビルド速度最大20倍向上。
- **Vitest デフォルト**: テストランナーは Vitest を標準使用。Jest からの移行を前提とする。
- **Built-in OpenTelemetry**: `@nestjs/telemetry` によるコントローラー・サービス・DB呼び出しの自動計装。トレースIDの自動伝播。
- **ESM by Default**: ECMAScript Modules がファーストクラスサポート。top-level `await` 対応。
- **Enhanced Logger**: `{ json: true }` で Cloud Run 向け JSON ログ出力対応。
- **Standalone Application**: `AppModule` なしでのブートストラップが可能。マイクロサービス/サーバーレス向け。

#### Next.js 15 重要な変更 (エージェント必読)

- **Async Server Components**: コンポーネントレベルで直接 `await` によるデータフェッチ。`getServerSideProps` / `getStaticProps` は `app/` ディレクトリでは不使用。
- **`react.cache`**: 同一レンダリング内のリクエスト重複排除に使用。
- **Streaming & Partial Rendering**: `<Suspense>` を活用した非ブロッキングUI描画。
- **並列データフェッチ**: `Promise.all()` でデータ取得を並列化し、パフォーマンスを最適化。

---

## 📁 Monorepo Structure

```
AI_Chatbot/
├── apps/
│   ├── web/              # Next.js 15 Frontend (Vercel)
│   │   └── AGENTS.md     # ⚙️ フロントエンド固有ルール
│   ├── api/              # NestJS 11 Backend (GCP Cloud Run)
│   │   └── AGENTS.md     # ⚙️ バックエンド固有ルール
│   └── line-bot/         # LINE Bot Server (Express)
├── packages/
│   ├── ui/               # shadcn/ui 共通コンポーネント
│   ├── database/         # Prisma schema + migrations
│   ├── types/            # TypeScript 共通型定義
│   └── langchain/        # AI/プロンプト共通ライブラリ
├── memory-bank/          # 🧠 AI長期記憶 (Compaction対応)
│   ├── context/          # プロジェクトコンテキスト
│   ├── decisions/        # 技術的意思決定ログ (ADR形式)
│   └── progress/         # 進捗スナップショット
├── terraform/            # GCP インフラ定義
├── docs/                 # ドキュメント
│   ├── TECH_STACK.md     # 技術スタック詳細
│   ├── API_SPEC.md       # API仕様書
│   └── DATABASE_SCHEMA.md # DB設計書
├── AGENTS.md             # 📘 このファイル (ルート共通ルール)
├── BACKLOG.md            # 📋 タスクバックログ
└── BRD_PRD.md            # 📄 要件定義書
```

---

## 🧭 AGENTS.md v1.1 運用原則

### 1. Jurisdiction (管轄権)

各ディレクトリの `AGENTS.md` は、そのディレクトリ配下に適用されるローカルルールを定義します。

```
ルート AGENTS.md (このファイル)
  → 全プロジェクト共通ルール

apps/web/AGENTS.md
  → フロントエンド固有ルール (Next.js 15, React 19, UI/UX)

apps/api/AGENTS.md
  → バックエンド固有ルール (NestJS 11, Prisma, API設計)
```

### 2. Accumulation & Precedence (蓄積と優先順位)

- 下位の指示は上位を**継承**します。
- 矛盾する場合は**下位（より具体的）が優先**されます。

> 例: ルート「すべてのコミットメッセージは英語で」 → apps/web「UIコンポーネントのコミットは日本語でも可」 → **apps/web では日本語コミット OK**

### 3. Implicit Inheritance (暗黙的継承)

このファイル（ルート AGENTS.md）の指示は、全配下ディレクトリに暗黙的に適用されます。サブディレクトリで再記述する必要はありません。

### 4. Progressive Disclosure (段階的開示)

トークン節約のため、AIは以下の順序でファイルを読み込みます:

1. **YAML Frontmatter** (`description`, `tags`) → インデックス化してタスクとの関連性を判定
2. **必要な場合のみ本文を読み込む** → トークン効率最大化

### 5. Partnership Spirit (パートナーシップ精神)

- 人間の指示に安易に同意せず、**前提を疑う**。
- 常により良い**アーキテクチャを提案**する。
- 技術的負債を発見したら**積極的に報告**する。

---

## 🚨 Critical Protocol: Human Approval Required

> **絶対ルール: 人間の承認なしに次のタスクへ進むことを禁じます。**

### タスク完了フロー

```
1. Plan       - 実装プランを作成し、承認を得る
   ↓
2. Search     - 実装前に必ず codebase_search を実行し、既存パターンを理解する
   ↓
3. Implement  - 目的達成のための「最小のコード変更」を心がける
   ↓
4. Verify     - 自動テスト実行 (Vitest / Playwright)
   ↓
5. Commit     - Conventional Commits 準拠で Git コミット
   ↓
6. 🛑 STOP   - 人間に報告し、承認（Approval）を待つ
   ↓
7. Approve    - 人間が動作確認 & 承認
   ↓
8. Next       - 次のタスクに着手
```

### 報告フォーマット

```markdown
## タスク完了報告

**タスクID**: [W1-xxx]
**タスク名**: 簡潔なタスク名
**所要時間**: X時間 (見積もり: Y時間)
**コミットハッシュ**: `abc1234`

### 実装内容
- 簡潔な箇条書き

### 検証結果
- ✅ テスト成功 / 型エラーなし
- ✅ `pnpm run lint` パス
- ✅ 動作確認済み

### 次のタスク
[W1-yyy] タスク名

**承認をお願いします。**
```

---

## 🛠️ Development Standards (全プロジェクト共通)

### Git Workflow

#### ブランチ戦略

```
main              # 本番環境 (保護ブランチ)
├── develop       # 開発ブランチ
└── feature/*     # 機能ブランチ
```

#### コミットメッセージ規約 (Conventional Commits)

```
<type>(<scope>): <subject>

Types:
  feat:     新機能
  fix:      バグ修正
  docs:     ドキュメント変更
  style:    コードフォーマット (機能変更なし)
  refactor: リファクタリング
  test:     テスト追加/修正
  chore:    ビルドツール変更等
  perf:     パフォーマンス改善

Examples:
  feat(faq): Add semantic search with pgvector
  fix(auth): Resolve JWT token expiration issue
  docs(agents): Update AGENTS.md with v1.1 spec
  perf(chat): Optimize streaming response latency
```

#### コミット規律

- **粒度**: 1ポイントタスク = 1コミット
- **状態**: コミット時点で必ず**ビルド可能な状態**を保つ
- **禁止**: `WIP: ...` コミットは使用しない

---

### Code Quality Standards

#### TypeScript 厳格モード

```jsonc
// tsconfig.json (全プロジェクト共通)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

> ⚠️ `any` の使用は原則禁止。やむを得ない場合はコメントで理由を明記すること。

#### ESLint & Prettier

```bash
# 実行コマンド (コミット前に必須)
pnpm run lint       # ESLint チェック
pnpm run lint:fix   # 自動修正
pnpm run format     # Prettier 実行
```

#### ファイル命名規約

```
Components:     PascalCase       例: ChatWindow.tsx, FaqForm.tsx
Utils/Hooks:    camelCase        例: useChat.ts, formatDate.ts
Constants:      UPPER_SNAKE_CASE 例: API_BASE_URL, MAX_RETRIES
Types:          PascalCase       例: User.ts, ChatMessage.ts
Test Files:     *.spec.ts        例: chatService.spec.ts (Vitest)
E2E Tests:      *.e2e.ts         例: auth.e2e.ts (Playwright)
```

---

### Error Handling Standards

#### エラーハンドリングパターン

```typescript
// ❌ 悪い例
try {
  const user = await fetchUser(id);
} catch (e) {
  console.log(e); // ロ��だけ
}

// ✅ 良い例: 期待されるエラーはデータとして返す
try {
  const user = await fetchUser(id);
} catch (error) {
  if (error instanceof NotFoundError) {
    // 期待されるエラー → 適切な HTTP レスポンスへ変換
    throw new HttpException('User not found', 404);
  }

  // 予期しないエラー → ログ + 監視 + 汎用レスポンス
  logger.error('Unexpected error in fetchUser', {
    userId: id,
    error: error.message,
    stack: error.stack,
  });

  throw new HttpException('Internal server error', 500);
}
```

#### Next.js 15 Server Component エラーハンドリング

```typescript
// ✅ error.tsx でルートレベルのエラーバウンダリ
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

#### ログレベル定義

```
logger.debug()  // 開発時デバッグ情報
logger.info()   // 通常の動作ログ
logger.warn()   // 警告 (非致命的エラー)
logger.error()  // エラー (監視アラート対象)
logger.fatal()  // 致命的エラー (即座に対応必要)
```

> **Cloud Run 向け**: NestJS 11 の `ConsoleLogger({ json: true })` を使用して構造化 JSON ログを出力すること。

---

### Testing Strategy

#### テストピラミッド

```
        /\
       /E2\      End-to-End (Playwright) - 5%
      /────\
     /Unit  \    Unit Tests (Vitest) - 70%
    /────────\
   /Integration\ Integration Tests - 25%
  /──────────────\
```

#### カバレッジ目標

| カテゴリ | 目標 |
|---|---|
| 最低ライン | 70% |
| 推奨 | 80%以上 |
| Critical Path (認証・決済) | 95%以上 |

#### テスト実行

```bash
# ローカル開発時 (Vitest)
pnpm test:watch

# コミット前 (Pre-commit hook)
pnpm test

# CI/CD (GitHub Actions)
pnpm test:ci --coverage
```

> **注意**: NestJS 11 では **Vitest** がデフォルトテストランナー。`jest.config` ではなく `vitest.config.ts` を使用すること。

---

### Performance Standards

#### API応答時間目標

```yaml
単純クエリ (GET /faqs):
  P50: < 100ms
  P95: < 200ms
  P99: < 500ms

AI推論含む (POST /chat/completion):
  P50: < 1500ms
  P95: < 2000ms
  P99: < 3000ms

WebSocket接続確立:
  < 500ms
```

#### キャッシュ戦略

```typescript
// Redis キャッシュパターン
const cacheKey = `faq:${tenantId}:${query}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await database.query(/* ... */);
await redis.setex(cacheKey, 300, JSON.stringify(result)); // TTL: 5分
return result;
```

#### Next.js 15 パフォーマンス最適化

```typescript
// ✅ 並列データフェッチ (Server Components)
export default async function DashboardPage() {
  const [tenant, faqs, analytics] = await Promise.all([
    fetchTenant(),
    fetchFaqs(),
    fetchAnalytics(),
  ]);

  return (
    <>
      <TenantHeader tenant={tenant} />
      <Suspense fallback={<FaqListSkeleton />}>
        <FaqList faqs={faqs} />
      </Suspense>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard data={analytics} />
      </Suspense>
    </>
  );
}
```

---

### Security Standards

| 項目 | ルール |
|---|---|
| 秘密情報 | GCP Secret Manager を使用。`.env` ファイルはコミット禁止 |
| Cloud Run | コールドスタート防止: `min-instances: 1` 以上を設定 |
| API 認証 | JWT + Guard ベース。全エンドポイントにデフォルトで認証を適用 |
| CORS | 許可オリジンをホワイトリストで明示管理 |
| 入力バリデーション | NestJS ValidationPipe + class-validator で全 DTO をバリデーション |
| SQL Injection | Prisma ORM のパラメータバインディングを必ず使用 |
| 依存関係監査 | `pnpm audit` を CI で定期実行 |

---

### Observability (NestJS 11 OpenTelemetry)

```typescript
// ✅ NestJS 11 の Built-in OpenTelemetry 活用
// main.ts
import { NestFactory } from '@nestjs/core';
import { TelemetryModule } from '@nestjs/telemetry';

const app = await NestFactory.create(AppModule);

// コントローラー、サービス、DB呼び出しが自動計装される
// トレースIDが自動伝播される
```

| メトリクス | 監視対象 |
|---|---|
| Request Latency | P50, P95, P99 |
| Error Rate | 5xx / Total Requests |
| Cache Hit Rate | Redis cache hit / miss ratio |
| AI Response Time | Gemini API latency |
| WebSocket Connections | Active connections count |

---

## 🧠 Memory Bank 運用ルール

AIの「忘却」を防ぐため、`memory-bank/` に知識を蓄積します。

### ディレクトリ構造

```
memory-bank/
├── context/
│   ├── project-overview.md      # プロジェクト全体概要
│   └── tech-decisions.md        # 技術選定理由
├── decisions/
│   ├── 001-why-gemini-over-gpt.md
│   ├── 002-supabase-vs-firebase.md
│   └── 003-monorepo-strategy.md
└── progress/
    ├── week-1-summary.md        # Week 1 完了サマリー
    ├── week-2-summary.md
    └── ...
```

### ファイル役割

| ファイル | 内容 |
|---|---|
| `progress/*.md` | 現在の進捗と完了タスクのリスト |
| `decisions/*.md` | アーキテクチャ決定（ADR形式）の記録 |
| `context/*.md` | プロジェクトコンテキストと技術選定理由 |

### Compaction (圧縮) プロトコル

大きなタスク完了後、AIは以下を実行:

1. **進捗サマリー作成**: `memory-bank/progress/week-X-summary.md` を作成

```markdown
# Week X 完了サマリー

**完了タスク**: N/N
**総所要時間**: X時間
**技術的ハイライト**:
- 主要な成果や発見

**memory-bank更新**:
- 更新したファイル一覧

**次週への引き継ぎ**:
- 次に着手すべきタスク
```

2. **コンテキスト圧縮**: 冗長な会話履歴を削除し、重要情報のみ `memory-bank` に保存
3. **人間への報告**: サマリーを人間に報告して承認を得る

---

## 📞 Human Contact Protocol

以下の場合は**即座に作業を停止**し、人間に質問します:

| 状況 | 例 |
|---|---|
| 破壊的操作の可能性 | `rm -rf`, `git push --force`, スキーマ破壊的マイグレーション |
| 複数の実装���法で判断が必要 | 「Zustand vs Context API、どちらを使うべきか？」 |
| セキュリティ上のリスク | 「このAPIエンドポイントは認証不要でよいか？」 |
| BACKLOG に記載のないタスク | 「Stripe Webhook 処理が必要だが、BACKLOG にない」 |
| 要件の矛盾を発見 | BRD_PRD.md と BACKLOG.md の間の不整合 |

### 質問フォーマット

```markdown
## 🚨 質問 - 作業停止中

**状況**: [タスクID] タスク名の実装中

**質問**:
具体的な質問内容

**選択肢**:
A. 選択肢A (推奨理由)
B. 選択肢B (推奨理由)
C. その他の方法

**影響範囲**:
- セキュリテ���リスク: 低/中/高
- 実装時間: 選択肢ごとの見積もり

**回答をお待ちしています。**
```

---

## 🔗 Related Documents

### 必読ドキュメント

| ドキュメント | 説明 |
|---|---|
| `BRD_PRD.md` | 要件定義書 |
| `BACKLOG.md` | タスクバックログ |
| `apps/web/AGENTS.md` | フロントエンド固有ルール |
| `apps/api/AGENTS.md` | バックエンド固有ルール |

### 技術ドキュメント

| ドキュメント | 説明 |
|---|---|
| `docs/TECH_STACK.md` | 技術スタック詳細 |
| `docs/API_SPEC.md` | API仕様書 |
| `docs/DATABASE_SCHEMA.md` | DB設計書 |

---

## 🎉 Success Criteria (Week 1)

Week 1 完了時、以下が達成されていること:

- [ ] Turborepo Monorepo 構築完了
- [ ] Supabase + pgvector セマンティック検索 動作確認
- [ ] Gemini API 応答速度 <3秒
- [ ] Next.js 15 / NestJS 11 初期起動確認
- [ ] WebSocket Echo サーバー動作確認
- [ ] 全タスク人間承認済み
- [ ] GitHub リポジトリに Week1 ブランチマージ

---

> **このファイルは「生きた文書」です。** タスクを通じて得た成功体験や困難は、随時このルールへフィードバックしてください。改善提案はいつでも歓迎します。
