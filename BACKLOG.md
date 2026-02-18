# AI Chatbot SaaS - 開発バックログ (2業種特化版)

**プロジェクト**: AI Chatbot SaaS Platform  
**リポジトリ**: https://github.com/NekoyaJolly/AI_Chatbot  
**対象業種**: ペットショップ + 動物病院 (拡張可能アーキテクチャ)  
**最終更新**: 2026-02-18  

---

## ⚠️ 人間承認プロトコル (必読)

**🔴 重要ルール**: 各タスク完了後、必ず以下を実行:
1. タスクを `🟢 DONE` にマーク
2. 完了報告 (成果物・テスト結果・所要時間) をコミット
3. **人間のレビュー・承認を待つ (次タスクに進まない)**
4. 承認後のみ次タスク開始

**違反時**: タスクを `🔴 BLOCKED` にマークし、全作業を停止。

---

## 📊 進捗サマリー

| Phase | タスク数 | 完了 | 進行中 | 未着手 | 見積もり時間 | 実績時間 | 進捗率 |
|-------|---------|------|--------|--------|-------------|---------|--------|
| Week 1 | 8 | 8 | 0 | 0 | 5h | 6h | 100% ✅ |
| Week 2 | 14 | 14 | 0 | 0 | 14h | 15h | 100% ✅ |
| Week 3 | 13 | 0 | 0 | 13 | 38h | 0h | 0% 🔜 |
| Week 4 | 14 | 0 | 0 | 14 | 34h | 0h | 0% 🔜 |
| Month 2 | 15 | 0 | 0 | 15 | 30h | 0h | 0% ⏳ |
| Month 3 | 14 | 0 | 0 | 14 | 28h | 0h | 0% ⏳ |
| **合計** | **78** | **22** | **0** | **56** | **149h** | **21h** | **28%** |

---

## 🚀 Week 1 - 技術検証 (8タスク, 6h実績) ✅ 完了

### [W1-001] Turborepo Monorepo 初期化 🟢 DONE
- **優先度**: P0
- **詳細**: `pnpm create turbo@latest AI_Chatbot --example with-tailwind` で初期化。`apps/web`, `apps/api`, `apps/line-bot`, `packages/ui`, `packages/database`, `packages/types`, `packages/langchain` 構成。
- **受け入れ基準**:
  - ✅ `pnpm install` 成功
  - ✅ `pnpm build` 全パッケージビルド成功
  - ✅ `turbo.json` パイプライン設定確認
  - ✅ GitHub にプッシュ完了
- **見積もり**: 30分
- **実績**: 35分
- **出力ファイル**: `turbo.json`, `pnpm-workspace.yaml`, `package.json`, `apps/*`, `packages/*`

---

### [W1-002] Supabase プロジェクトセットアップ & pgvector 有効化 🟢 DONE
- **優先度**: P0
- **詳細**: Supabase 無料プロジェクト作成。SQL Editor で `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pg_trgm;` 実行。接続テスト。
- **受け入れ基準**:
  - ✅ Supabase プロジェクト作成完了
  - ✅ pgvector 拡張有効化確認 (`SELECT * FROM pg_extension WHERE extname='vector';`)
  - ✅ 接続情報取得 (DATABASE_URL)
  - ✅ `.env` に接続情報設定
- **見積もり**: 20分
- **実績**: 25分
- **出力ファイル**: `.env.example` (DATABASE_URL テンプレート), `docs/SUPABASE_SETUP.md`

---

### [W1-003] Prisma スキーマ初期設計 (テナント・FAQ・ユーザー) 🟢 DONE
- **優先度**: P0
- **詳細**: `packages/database/prisma/schema.prisma` に以下モデル作成:
  - `User` (id, email, name, passwordHash, createdAt, updatedAt)
  - `Tenant` (id, name, industry, customPrompt, escalationKeywords, createdAt)
  - `UserTenant` (userId, tenantId, role) - 多対多中間テーブル
  - `Faq` (id, tenantId, question, answer, category, embedding vector(1536), clickCount, createdAt)
- **受け入れ基準**:
  - ✅ Prisma スキーマ文法エラーなし
  - ✅ `pnpm prisma generate` 成功
  - ✅ `pnpm prisma migrate dev --name init` マイグレーション成功
  - ✅ Supabase DB に4テーブル作成確認
- **見積もり**: 45分
- **実績**: 50分
- **出力ファイル**: `packages/database/prisma/schema.prisma`, `packages/database/prisma/migrations/*/migration.sql`

---

### [W1-004] Gemini API セットアップ & 応答テスト 🟢 DONE
- **優先度**: P0
- **詳細**: Google AI Studio で API キー取得。`@google/generative-ai` インストール。テストスクリプト: 「こんにちは、ペットショップの営業時間を教えて」→ 応答取得 & レイテンシ計測。
- **受け入れ基準**:
  - ✅ Gemini API キー取得 & `.env` 設定
  - ✅ `gemini-1.5-flash-latest` モデルで応答成功
  - ✅ 平均レイテンシ <3秒 (5回テスト)
  - ✅ エラーハンドリング確認 (無効キー、レート制限)
- **見積もり**: 30分
- **実績**: 40分
- **出力ファイル**: `packages/langchain/tests/gemini-test.ts`, `docs/GEMINI_API_SETUP.md`

---

### [W1-005] pgvector セマンティック検索テスト 🟢 DONE
- **優先度**: P0
- **詳細**: テスト FAQ 10問を Supabase に手動挿入 (Embedding は Gemini `text-embedding-004` で生成)。テストクエリ「犬のワクチン」で類似度検索 (コサイン距離 `<=>` 演算子)、上位3件取得。精度検証。
- **受け入れ基準**:
  - ✅ 10問 FAQ 挿入完了 (Embedding 含む)
  - ✅ セマンティック検索成功 (SQL: `SELECT * FROM "Faq" ORDER BY embedding <=> $1 LIMIT 3`)
  - ✅ 正答率 >95% (10クエリテスト)
  - ✅ 検索速度 <100ms (10件 FAQ)
- **見積もり**: 1時間
- **実績**: 1時間10分
- **出力ファイル**: `packages/database/seeds/test-faqs.sql`, `packages/langchain/tests/pgvector-search-test.ts`, `docs/PGVECTOR_SEARCH_RESULTS.md`

---

### [W1-006] Next.js 15 プロジェクト初期化 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/web` に Next.js 15 (App Router) セットアップ。shadcn/ui 初期化 (`npx shadcn-ui@latest init`)、Tailwind CSS v4 設定、基本レイアウト作成 (`app/layout.tsx`)。
- **受け入れ基準**:
  - ✅ `pnpm --filter web dev` でローカルサーバー起動 (http://localhost:3000)
  - ✅ shadcn/ui コンポーネント動作確認 (Button, Card)
  - ✅ Tailwind CSS クラス適用確認
  - ✅ TypeScript エラーなし
- **見積もり**: 40分
- **実績**: 45分
- **出力ファイル**: `apps/web/app/layout.tsx`, `apps/web/tailwind.config.ts`, `apps/web/components.json`

---

### [W1-007] NestJS 10 API プロジェクト初期化 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/api` に NestJS 10 プロジェクト作成 (`nest new api`)。Prisma クライアント統合 (`PrismaModule`, `PrismaService`)、Swagger セットアップ (`@nestjs/swagger`)、ヘルスチェックエンドポイント (`GET /health`)。
- **受け入れ基準**:
  - ✅ `pnpm --filter api start:dev` でサーバー起動 (http://localhost:4000)
  - ✅ `GET /health` が `{ status: 'ok', timestamp: ... }` 返却
  - ✅ Swagger UI 動作確認 (http://localhost:4000/api/docs)
  - ✅ Prisma クライアント接続確認 (DB クエリテスト)
- **見積もり**: 1時間
- **実績**: 1時間5分
- **出力ファイル**: `apps/api/src/main.ts`, `apps/api/src/prisma/prisma.module.ts`, `apps/api/src/health/health.controller.ts`

---

### [W1-008] WebSocket 基礎実装 (Echo サーバー) 🟢 DONE
- **優先度**: P0
- **詳細**: NestJS に `@nestjs/websockets` 統合。`ChatGateway` 作成 (`@WebSocketGateway()`)。Echo 機能実装 (クライアント送信 → サーバー受信 → 全クライアントにブロードキャスト)。Postman/Insomnia でテスト。
- **受け入れ基準**:
  - ✅ WebSocket サーバー起動 (ws://localhost:4000)
  - ✅ Echo 機能動作 (送信 `{ message: 'test' }` → 受信同内容)
  - ✅ 複数クライアント接続テスト (2接続で相互メッセージ確認)
  - ✅ 接続/切断ログ出力
- **見積もり**: 45分
- **実績**: 50分
- **出力ファイル**: `apps/api/src/chat/chat.gateway.ts`, `apps/api/tests/websocket-echo.e2e-spec.ts`

---

## 🔧 Week 2 - 認証 & FAQ 基盤 (14タスク, 15h実績) ✅ 完了

### [W2-001] NextAuth.js v5 セットアップ 🟢 DONE
- **優先度**: P0
- **詳細**: `next-auth@beta`, `@auth/prisma-adapter` インストール。`app/api/auth/[...nextauth]/route.ts` 作成。Prisma Adapter 設定、JWT セッション (30日)、Credentials & Google プロバイダー追加。
- **受け入れ基準**:
  - ✅ NextAuth 初期化成功
  - ✅ `/api/auth/signin` ページ表示
  - ✅ Credentials ログイン動作 (テストユーザー)
  - ✅ セッション取得 (`getServerSession`) 動作確認
- **見積もり**: 1時間
- **実績**: 1時間10分
- **出力ファイル**: `apps/web/app/api/auth/[...nextauth]/route.ts`, `apps/web/lib/auth.ts`, `types/next-auth.d.ts`

---

### [W2-002] ログイン & 登録画面 UI 🟢 DONE
- **優先度**: P0
- **詳細**: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx` 作成。shadcn/ui `Form`, `Input`, `Button` 使用。React Hook Form + Zod バリデーション。
- **受け入れ基準**:
  - ✅ ログインフォーム動作 (email, password)
  - ✅ 登録フォーム動作 (name, email, password, industry 選択)
  - ✅ バリデーションエラー表示 (Zod スキーマ)
  - ✅ レスポンシブデザイン (モバイル/デスクトップ)
- **見積もり**: 1.5時間
- **実績**: 1時間40分
- **出力ファイル**: `apps/web/app/(auth)/login/page.tsx`, `apps/web/app/(auth)/signup/page.tsx`, `apps/web/lib/validations/auth.ts`

---

### [W2-003] NestJS 認証モジュール (JWT戦略) 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/api/src/modules/auth/` 作成。`auth.service.ts` にユーザー登録・ログイン・JWT発行ロジック実装。`JwtStrategy`, `JwtAuthGuard` 作成。
- **受け入れ基準**:
  - ✅ `POST /auth/register` 動作 (bcrypt ハッシュ)
  - ✅ `POST /auth/login` 動作 (JWT 発行)
  - ✅ JWT 検証ガード動作 (保護ルートテスト)
  - ✅ ユニットテスト (Jest, カバレッジ >80%)
- **見積もり**: 2時間
- **実績**: 2時間10分
- **出力ファイル**: `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/auth/strategies/jwt.strategy.ts`, `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`

---

### [W2-004] FAQ CRUD API 実装 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/api/src/modules/faqs/` に CRUD エンドポイント作成:
  - `POST /faqs` (作成 + Embedding 自動生成)
  - `GET /faqs?tenantId=xxx` (一覧取得、ページネーション)
  - `PUT /faqs/:id` (更新 + Embedding 再生成)
  - `DELETE /faqs/:id` (削除)
- **受け入れ基準**:
  - ✅ 全エンドポイント動作 (Swagger UI 確認)
  - ✅ Embedding 自動生成 (Gemini `text-embedding-004`)
  - ✅ テナント分離 (JWT から tenantId 取得)
  - ✅ E2E テスト (Supertest)
- **見積もり**: 2時間
- **実績**: 2時間20分
- **出力ファイル**: `apps/api/src/modules/faqs/faqs.controller.ts`, `apps/api/src/modules/faqs/faqs.service.ts`, `apps/api/tests/faqs.e2e-spec.ts`

---

### [W2-005] Embedding 生成サービス 🟢 DONE
- **優先度**: P0
- **詳細**: `packages/langchain/src/services/embedding.service.ts` 作成。Gemini `text-embedding-004` モデルでテキスト → 1536次元ベクトル変換。バッチ処理対応 (100件/リクエスト)。
- **受け入れ基準**:
  - ✅ 単一テキスト Embedding 成功
  - ✅ バッチ処理成功 (100件)
  - ✅ エラーハンドリング (API 失敗、タイムアウト)
  - ✅ ユニットテスト (モック API)
- **見積もり**: 1時間
- **実績**: 1時間10分
- **出力ファイル**: `packages/langchain/src/services/embedding.service.ts`, `packages/langchain/tests/embedding.service.spec.ts`

---

### [W2-006] FAQ 管理画面 UI 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/web/src/app/(dashboard)/faqs/page.tsx` 作成。shadcn/ui `Table`, `Dialog`, `Form` 使用。機能: 一覧表示、作成ダイアログ、編集ダイアログ、削除確認、検索フィルタ。
- **受け入れ基準**:
  - ✅ FAQ 一覧取得表示 (React Query)
  - ✅ 作成・編集・削除動作確認
  - ✅ 検索フィルタ (カテゴリ、キーワード)
  - ✅ ページネーション (shadcn/ui Pagination)
  - ✅ レスポンシブデザイン
- **見積もり**: 2.5時間
- **実績**: 2時間50分
- **出力ファイル**: `apps/web/src/app/(dashboard)/faqs/page.tsx`, `apps/web/src/components/faqs/faq-table.tsx`, `apps/web/src/components/faqs/faq-dialog.tsx`

---

### [W2-007] CSV バルクインポート機能 🟢 DONE
- **優先度**: P1
- **詳細**: `POST /faqs/bulk-import` エンドポイント作成。CSV アップロード (`multer`)、パース (`csv-parser`)、バリデーション、Embedding 一括生成、DB 一括挿入。
- **受け入れ基準**:
  - ✅ CSV アップロード動作 (100件テスト)
  - ✅ Embedding 一括生成 (<5秒/100件)
  - ✅ エラーハンドリング (不正フォーマット、重複)
  - ✅ 進捗レスポンス (WebSocket 通知)
- **見積もり**: 1.5時間
- **実績**: 1時間40分
- **出力ファイル**: `apps/api/src/modules/faqs/bulk-import.service.ts`, `apps/web/src/components/faqs/csv-upload.tsx`

---

### [W2-008] Row Level Security (RLS) 実装 🟢 DONE
- **優先度**: P0
- **詳細**: Supabase RLS ポリシー設定。全テーブルで `tenantId` による行レベル分離。Prisma middleware で `tenantId` 自動注入。
- **受け入れ基準**:
  - ✅ RLS ポリシー有効化確認 (SQL: `ALTER TABLE "Faq" ENABLE ROW LEVEL SECURITY;`)
  - ✅ ポリシー作成 (SELECT/INSERT/UPDATE/DELETE)
  - ✅ クロステナントアクセス防止テスト
  - ✅ Prisma middleware 動作確認
- **見積もり**: 1時間
- **実績**: 1時間15分
- **出力ファイル**: `packages/database/prisma/migrations/*/rls-policies.sql`, `packages/database/src/middleware/tenant-isolation.ts`

---

### [W2-009] ダッシュボードレイアウト 🟢 DONE
- **優先度**: P0
- **詳細**: `apps/web/src/app/(dashboard)/layout.tsx` 作成。サイドバー (`Sidebar.tsx`)、ヘッダー (`Header.tsx`)、ナビゲーション (Dashboard, FAQ管理, チャット履歴, 分析, 埋め込み, 設定)。
- **受け入れ基準**:
  - ✅ レイアウト表示確認
  - ✅ ナビゲーション動作 (リンククリック)
  - ✅ レスポンシブ (モバイルでハンバーガーメニュー)
  - ✅ ユーザー情報表示 (ヘッダー)
- **見積もり**: 1.5時間
- **実績**: 1時間40分
- **出力ファイル**: `apps/web/src/app/(dashboard)/layout.tsx`, `apps/web/src/components/dashboard/sidebar.tsx`, `apps/web/src/components/dashboard/header.tsx`

---

### [W2-010] ダッシュボードホーム画面 🟢 DONE
- **優先度**: P1
- **詳細**: `apps/web/src/app/(dashboard)/page.tsx` 作成。KPI カード (総チャット数、今日のチャット、FAQ数、応答率)、簡易グラフ (Recharts - 7日間チャット数)。
- **受け入れ基準**:
  - ✅ KPI カード表示 (ダミーデータ)
  - ✅ 簡易グラフ描画 (Recharts LineChart)
  - ✅ React Query でデータ取得
  - ✅ ローディング/エラー状態
- **見積もり**: 1.5時間
- **実績**: 1時間30分
- **出力ファイル**: `apps/web/src/app/(dashboard)/page.tsx`, `apps/web/src/components/dashboard/kpi-card.tsx`

---

### [W2-011] エラーハンドリング統一 🟢 DONE
- **優先度**: P0
- **詳細**: NestJS グローバル例外フィルタ (`AllExceptionsFilter`) 作成。Next.js エラーバウンダリ (`error.tsx`), トースト通知 (`sonner`)。
- **受け入れ基準**:
  - ✅ API エラーレスポンス統一形式 (`{ statusCode, message, timestamp }`)
  - ✅ フロントエンドエラーバウンダリ動作
  - ✅ トースト通知表示 (成功/エラー)
  - ✅ ログ記録 (Sentry 統合準備)
- **見積もり**: 1時間
- **実績**: 1時間5分
- **出力ファイル**: `apps/api/src/filters/all-exceptions.filter.ts`, `apps/web/src/app/error.tsx`, `apps/web/src/lib/toast.ts`

---

### [W2-012] 型定義共有パッケージ 🟢 DONE
- **優先度**: P1
- **詳細**: `packages/types` 作成。DTO 型定義 (User, Tenant, Faq, ChatMessage 等) を共有。Zod スキーマもエクスポート。
- **受け入れ基準**:
  - ✅ 型定義ファイル作成 (10+ 型)
  - ✅ Zod スキーマ作成 (バリデーション用)
  - ✅ フロントエンド/バックエンドで型共有確認
  - ✅ TypeScript エラーなし
- **見積もり**: 45分
- **実績**: 50分
- **出力ファイル**: `packages/types/src/index.ts`, `packages/types/src/schemas/*.ts`

---

### [W2-013] E2E テスト基盤 (Playwright) 🟢 DONE
- **優先度**: P1
- **詳細**: Playwright セットアップ (`pnpm create playwright`)。基本フロー2件テスト: (1) ログイン → ダッシュボード表示、(2) FAQ 作成 → 一覧表示確認。
- **受け入れ基準**:
  - ✅ Playwright インストール完了
  - ✅ 2件 E2E テスト成功
  - ✅ CI/CD 統合準備 (GitHub Actions 設定)
  - ✅ スクリーンショット保存
- **見積もり**: 1.5時間
- **実績**: 1時間40分
- **出力ファイル**: `apps/web/tests/e2e/login.spec.ts`, `apps/web/tests/e2e/faq.spec.ts`, `playwright.config.ts`

---

### [W2-014] Week 2 完了レビュー 🟢 DONE
- **優先度**: P0
- **詳細**: Week 1-2 の全22タスク完了確認。チェックリスト: 全タスク DONE、GitHub マージ、ドキュメント更新、デプロイ動作確認、統合テスト成功。
- **受け入れ基準**:
  - ✅ 全22タスク DONE マーク
  - ✅ GitHub ブランチ (`week-1-2`) マージ完了
  - ✅ README, BACKLOG, AGENTS.md 更新
  - ✅ ローカル統合テスト成功 (フロント + API + DB)
  - ✅ memory-bank 更新 (`week-1-2-summary.md`)
- **見積もり**: 30分
- **実績**: 35分
- **出力ファイル**: `memory-bank/progress/week-1-2-summary.md`, `BACKLOG.md` (Week 3 タスク追加)

---

## 🚀 Week 3 - AI統合 & リアルタイムチャット (13タスク, 38h見積もり) 🔜

### [W3-001] LangChain.js セットアップ & Gemini統合 🔴 TODO
- **優先度**: P0
- **対象業種**: 全業種共通 (拡張可能設計)
- **詳細**: `packages/langchain` パッケージ作成。`langchain`, `@google/generative-ai` インストール。`GeminiService` クラス作成 (`ChatGoogleGenerativeAI`, model `gemini-1.5-flash-latest`, temperature 0.7, max tokens 500)。
- **受け入れ基準**:
  - ✅ Gemini API キー検証成功
  - ✅ テスト応答 「こんにちは」 → レスポンス取得 (<3秒)
  - ✅ エラーハンドリング (API キー無効、レート制限、タイムアウト)
  - ✅ ユニットテスト (Jest, カバレッジ >80%)
- **見積もり**: 2時間
- **出力ファイル**: `packages/langchain/src/services/gemini.service.ts`, `packages/langchain/src/index.ts`, `packages/langchain/tests/gemini.service.spec.ts`
- **依存関係**: Week 1 完了

---

### [W3-002] 業種別プロンプトテンプレート作成 (ペットショップ + 動物病院) 🔴 TODO
- **優先度**: P0
- **対象業種**: 2業種 (pet_shop, animal_hospital) + 拡張用テンプレート構造
- **詳細**: `packages/langchain/src/prompts/` に YAML 形式テンプレート作成。各テンプレート: `system_prompt`, `user_template`, `context_template`, `escalation_keywords`。
  - **ペットショップ**: 「あなたはペットショップの親切なアシスタントです。営業時間・ペット情報・購入手続きについて回答します...」
  - **動物病院**: 「あなたは動物病院の受付スタッフです。診療時間・予約・診療科目・救急対応について案内します...」
  - **拡張用**: `_template.yaml` (新業種追加時のひな型)
- **受け入れ基準**:
  - ✅ 2業種 × テンプレートファイル作成
  - ✅ 拡張用テンプレート (`_template.yaml`) 作成
  - ✅ LangChain `PromptTemplate` でロード可能
  - ✅ コンテキスト変数埋め込み動作確認 (tenant_name, faq_context, user_query)
  - ✅ エスカレーションキーワードリスト (例: "苦情", "返金", "話したい", "緊急", "救急")
- **見積もり**: 2時間
- **出力ファイル**: `packages/langchain/src/prompts/pet_shop.yaml`, `animal_hospital.yaml`, `_template.yaml`, `packages/langchain/src/services/prompt-loader.service.ts`, `docs/PROMPT_TEMPLATES.md`
- **依存関係**: [W3-001] 完了

---

### [W3-003] RAGパイプライン実装 (pgvector検索 + コンテキスト生成) 🔴 TODO
- **優先度**: P0
- **詳細**: `apps/api/src/modules/ai/rag.service.ts` 作成。処理フロー:
  1. ユーザークエリ Embedding 化 (`text-embedding-004`)
  2. pgvector コサイン類似度検索 (上位5件、閾値 >0.75)
  3. FAQ を `context` 文字列化 (Q&Aペア)
  4. プロンプトテンプレートに `{faq_context}` 注入
- **受け入れ基準**:
  - ✅ pgvector 検索成功 (1000件FAQ で <100ms)
  - ✅ 類似度閾値フィルタリング動作
  - ✅ コンテキスト生成 (最大3000文字制限)
  - ✅ エラーハンドリング (DB接続失敗、Embedding API失敗)
  - ✅ ユニットテスト (モック Prisma + Gemini)
- **見積もり**: 4時間
- **出力ファイル**: `apps/api/src/modules/ai/rag.service.ts`, `apps/api/src/modules/ai/rag.service.spec.ts`
- **依存関係**: [W3-001], [W3-002] 完了

---

### [W3-004] AI応答生成エンドポイント (POST /ai/chat) 🔴 TODO
- **優先度**: P0
- **詳細**: `apps/api/src/modules/ai/ai.controller.ts` に `POST /ai/chat` 実装。リクエスト: `{ message: string, tenantId: string, sessionId?: string }`. レスポンス: `{ reply: string, usedFaqIds: string[], confidence: number, shouldEscalate: boolean, tokensUsed: number }`.
- **受け入れ基準**:
  - ✅ エンドポイント動作 (Swagger UI)
  - ✅ RAG統合 (関連FAQ取得確認)
  - ✅ 応答時間 <2秒
  - ✅ エスカレーション判定 (キーワード OR confidence <0.6)
  - ✅ JWT 認証 & テナント分離
  - ✅ E2E テスト (Supertest)
- **見積もり**: 3時間
- **出力ファイル**: `apps/api/src/modules/ai/ai.controller.ts`, `apps/api/src/modules/ai/dto/chat.dto.ts`, `apps/api/tests/ai.e2e-spec.ts`
- **依存関係**: [W3-003] 完了

---

### [W3-005] AI応答ログ記録 (Analytics連携) 🔴 TODO
- **優先度**: P1
- **詳細**: `ChatLog` テーブル作成 (Prisma schema 追加)。フィールド: `id, tenantId, sessionId, userMessage, aiReply, usedFaqIds (JSON), confidence, shouldEscalate, tokensUsed, responseTimeMs, createdAt`. `AnalyticsService` で集計 (日次チャット数、平均信頼度、エスカレーション率)。
- **受け入れ基準**:
  - ✅ ログ保存成功 (<50ms)
  - ✅ Analytics API (`GET /analytics/chat-stats?from=YYYY-MM-DD&to=YYYY-MM-DD`)
  - ✅ パフォーマンス (ログ書き込み <50ms、分析クエリ <200ms)
  - ✅ ユニットテスト
- **見積もり**: 2時間
- **出力ファイル**: `packages/database/prisma/schema.prisma` (ChatLog model), `apps/api/src/modules/analytics/analytics.service.ts`
- **依存関係**: [W3-004] 完了

---

### [W3-006] Socket.io サーバーセットアップ (WebSocket Gateway) 🔴 TODO
- **優先度**: P0
- **詳細**: `apps/api/src/modules/chat/chat.gateway.ts` 作成。`@WebSocketGateway()` で WebSocket 初期化 (CORS: Vercel ドメイン許可)。`handleConnection`, `handleDisconnect` でクライアント管理。
- **受け入れ基準**:
  - ✅ WebSocket 接続確立 (Postman/Insomnia)
  - ✅ JWT 認証ミドルウェア (接続時トークン検証)
  - ✅ テナント分離 (socket.data.tenantId 保存)
  - ✅ 同時接続 100 クライアントで正常動作
  - ✅ 接続/切断ログ記録
- **見積もり**: 3時間
- **出力ファイル**: `apps/api/src/modules/chat/chat.gateway.ts`, `apps/api/src/modules/chat/chat.module.ts`
- **依存関係**: Week 1 [W1-008] 完了

---

### [W3-007] チャットメッセージイベント実装 (message, typing, read) 🔴 TODO
- **優先度**: P0
- **詳細**: WebSocket イベント実装:
  - `client→server: message` (`{ message, sessionId }`)
  - `server→client: message` (`{ id, sender, message, timestamp }`)
  - `client→server: typing` (タイピング中)
  - `server→client: typing` (他ユーザーに通知)
  - `client→server: read` (既読)
  - `server→client: read` (既読確認)
- **受け入れ基準**:
  - ✅ 双方向通信動作 (2クライアント間送受信)
  - ✅ タイピングインジケータ動作
  - ✅ 既読管理 (readAt タイムスタンプ)
  - ✅ エラーハンドリング
  - ✅ E2E テスト (socket.io-client)
- **見積もり**: 4時間
- **出力ファイル**: `apps/api/src/modules/chat/chat.gateway.ts` (イベントハンドラ), `apps/api/tests/chat.e2e-spec.ts`
- **依存関係**: [W3-006] 完了

---

### [W3-008] チャット履歴保存 & 取得API 🔴 TODO
- **優先度**: P0
- **詳細**: `ChatMessage` テーブル作成 (Prisma: `id, tenantId, sessionId, sender (user|ai), message, readAt, createdAt`)。API:
  - `POST /chat/messages` (保存)
  - `GET /chat/messages?sessionId=xxx` (履歴取得、ページネーション)
  - `PATCH /chat/messages/:id/read` (既読更新)
- **受け入れ基準**:
  - ✅ メッセージ保存 (<50ms)
  - ✅ 履歴取得 (1000件で <200ms、インデックス設定)
  - ✅ ページネーション (cursor-based, limit=50)
  - ✅ テナント分離 (RLS)
  - ✅ ユニットテスト
- **見積もり**: 2時間
- **出力ファイル**: `packages/database/prisma/schema.prisma` (ChatMessage model), `apps/api/src/modules/chat/chat.service.ts`
- **依存関係**: [W3-007] 完了

---

### [W3-009] リアルタイムチャットコンポーネント (Next.js) 🔴 TODO
- **優先度**: P0
- **詳細**: `apps/web/src/components/chat/chat-window.tsx` 作成。`socket.io-client`, Zustand (状態管理), React Hook Form。機能: メッセージ送受信、タイピング表示、既読表示、自動スクロール。
- **受け入れ基準**:
  - ✅ WebSocket 接続確立 (ws://localhost:4000)
  - ✅ メッセージ送受信動作
  - ✅ タイピングインジケータ表示
  - ✅ 既読機能 (✓✓ マーク)
  - ✅ レスポンシブデザイン
  - ✅ エラーハンドリング
- **見積もり**: 4時間
- **出力ファイル**: `apps/web/src/components/chat/chat-window.tsx`, `apps/web/src/stores/chat-store.ts`
- **依存関係**: [W3-007], [W3-008] 完了

---

### [W3-010] チャット履歴ページ 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/web/src/app/(dashboard)/chat-history/page.tsx` 作成。機能: セッション一覧 (無限スクロール)、セッション選択でメッセージ表示、検索 (日付範囲、キーワード)、CSV エクスポート。
- **受け入れ基準**:
  - ✅ セッション一覧取得 (React Query)
  - ✅ メッセージ履歴取得
  - ✅ 無限スクロール (Intersection Observer)
  - ✅ 検索機能
  - ✅ CSV エクスポート (react-csv)
  - ✅ ローディング/エラー状態
- **見積もり**: 3時間
- **出力ファイル**: `apps/web/src/app/(dashboard)/chat-history/page.tsx`, `apps/web/src/components/chat/session-list.tsx`
- **依存関係**: [W3-008] 完了

---

### [W3-011] 業種別FAQテンプレート追加 (ペットショップ + 動物病院) 🔴 TODO
- **優先度**: P1
- **対象業種**: 2業種 × 各80問 = 160問
- **詳細**: CSV 形式 FAQ 作成:
  - **ペットショップ** (80問): 店舗情報・営業時間 (15問), ペット選び (25問), 購入手続き (15問), 飼育サポート (20問), 商品・サービス (5問)
  - **動物病院** (80問): 診療時間・予約 (20問), 診療科目 (20問), ワクチン・予防 (15問), 救急対応 (10問), 料金・保険 (15問)
- **受け入れ基準**:
  - ✅ 2業種 × 80問 = 160問作成 (Gemini で生成 + 人間レビュー)
  - ✅ CSVフォーマット検証 (`question, answer, category, industry`)
  - ✅ バルクインポート成功 (`POST /faqs/bulk-import`)
  - ✅ pgvector Embedding 生成完了 (<3秒/問)
  - ✅ セマンティック検索精度 >90% (20クエリテスト)
- **見積もり**: 3時間
- **出力ファイル**: `packages/database/seeds/pet_shop_faqs.csv`, `animal_hospital_faqs.csv`, `docs/FAQ_TEMPLATES.md`
- **依存関係**: Week 2 [W2-007] 完了

---

### [W3-012] テナント設定UI (業種選択・プロンプトカスタマイズ) 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/web/src/app/(dashboard)/settings/page.tsx` に設定フォーム追加。フィールド: `industry` (select: pet_shop, animal_hospital, other), `customSystemPrompt` (textarea), `escalationKeywords` (tag input)。API: `PATCH /tenants/:id/settings`.
- **受け入れ基準**:
  - ✅ 業種選択 (2業種 + その他)
  - ✅ カスタムプロンプト保存・取得
  - ✅ エスカレーションキーワード編集
  - ✅ プレビュー機能 (テストメッセージ送信)
  - ✅ バリデーション (プロンプト最大5000文字)
- **見積もり**: 2時間
- **出力ファイル**: `apps/web/src/app/(dashboard)/settings/page.tsx`, `apps/api/src/modules/tenants/tenants.controller.ts`
- **依存関係**: [W3-002] 完了

---

### [W3-013] Redis キャッシュ実装 (FAQ検索結果・AI応答) 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/api/src/modules/cache/cache.service.ts` 作成。Redis (`ioredis`) でキャッシュ:
  - FAQ セマンティック検索 (TTL 5分, key: `faq:search:{tenantId}:{queryHash}`)
  - AI 応答 (TTL 1時間, key: `ai:response:{tenantId}:{messageHash}`)
- **受け入れ基準**:
  - ✅ Redis 接続成功 (ローカル Docker or GCP Memorystore)
  - ✅ キャッシュヒット率 >50% (開発環境)
  - ✅ FAQ検索速度改善 (キャッシュヒット <10ms)
  - ✅ AI応答速度改善 (同一質問 <100ms)
  - ✅ キャッシュ無効化API (`POST /cache/invalidate`)
- **見積もり**: 3時間
- **出力ファイル**: `apps/api/src/modules/cache/cache.service.ts`, `apps/api/tests/cache.e2e-spec.ts`
- **依存関係**: [W3-003], [W3-004] 完了

---

### [W3-014] Week 3 完了レビュー & Week 4 準備 🔴 TODO
- **優先度**: P0
- **詳細**: Week 3 の全13タスク完了確認。チェックリスト: 全タスク DONE、ブランチマージ、ドキュメント更新、デプロイ動作確認、統合テスト成功。Week 4 タスクリスト確認。
- **受け入れ基準**:
  - ✅ 全13タスク DONE マーク
  - ✅ GitHub ブランチ (`week-3`) マージ完了
  - ✅ README, BACKLOG, AGENTS.md 更新
  - ✅ AI 応答テスト成功 (2業種 × 各10質問)
  - ✅ WebSocket チャットテスト成功
  - ✅ memory-bank 更新 (`week-3-summary.md`)
- **見積もり**: 1時間
- **出力ファイル**: `memory-bank/progress/week-3-summary.md`, `BACKLOG.md` (Week 4 タスク追加)
- **依存関係**: [W3-001]~[W3-013] 完了

---

## 🔧 Week 4 - LINE Bot & セキュリティ強化 (14タスク, 34h見積もり) ⏳

### [W4-001] LINE Messaging API セットアップ 🔴 TODO
- **優先度**: P1
- **詳細**: LINE Developers コンソールでチャネル作成、Webhook URL 設定 (`https://your-api.run.app/line/webhook`)。`apps/line-bot` アプリ作成 (NestJS)。`@line/bot-sdk` インストール。
- **受け入れ基準**:
  - ✅ LINE チャネル作成完了
  - ✅ Webhook URL 検証成功
  - ✅ LINE Bot SDK 初期化 (Channel Secret + Access Token)
  - ✅ Webhook 署名検証動作
- **見積もり**: 2時間
- **出力ファイル**: `apps/line-bot/src/main.ts`, `apps/line-bot/src/modules/line/line.controller.ts`
- **依存関係**: Week 3 完了

---

### [W4-002] LINE Webhook ハンドラ実装 (メッセージ受信→AI応答) 🔴 TODO
- **優先度**: P1
- **詳細**: `POST /line/webhook` 実装。処理: LINE メッセージ受信 → テナント特定 (LINE ユーザーID → tenantId マッピング) → AI応答 (`/ai/chat`) → LINE Reply API。
- **受け入れ基準**:
  - ✅ テキストメッセージ受信・返信動作
  - ✅ AI 応答統合 (Gemini + RAG)
  - ✅ エラーハンドリング (テナント未特定、API失敗)
  - ✅ ログ記録
  - ✅ E2E テスト (LINE Bot Simulator)
- **見積もり**: 3時間
- **出力ファイル**: `apps/line-bot/src/modules/line/line.service.ts`, `apps/line-bot/tests/line.e2e-spec.ts`
- **依存関係**: [W4-001], Week 3 AI統合 完了

---

### [W4-003] LINE Bot UI設定 (リッチメニュー・クイックリプライ) 🔴 TODO
- **優先度**: P2
- **詳細**: LINE リッチメニュー作成 (6タイル: よくある質問、営業時間、予約、問い合わせ、公式サイト、設定)。クイックリプライ (FAQ カテゴリ選択)。
- **受け入れ基準**:
  - ✅ リッチメニュー表示 (画像 2500×1686px)
  - ✅ タイルタップ動作
  - ✅ クイックリプライ表示
  - ✅ 画像最適化 (<1MB)
- **見積もり**: 2時間
- **出力ファイル**: `apps/line-bot/src/modules/line/rich-menu.service.ts`, `assets/line-rich-menu.png`
- **依存関係**: [W4-002] 完了

---

### [W4-004] Analytics API 実装 (チャット統計・FAQ人気度) 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/api/src/modules/analytics/analytics.service.ts` に集計メソッド追加:
  - `getChatStats(tenantId, from, to)`: 日次チャット数、AI応答率、エスカレーション率、平均信頼度
  - `getFaqPopularity(tenantId, limit)`: 使用回数上位FAQ
  - `getUserEngagement(tenantId, from, to)`: アクティブユーザー数、平均セッション時間
- **受け入れ基準**:
  - ✅ API エンドポイント動作 (`GET /analytics/chat-stats`, `/analytics/faq-popularity`, `/analytics/user-engagement`)
  - ✅ 集計クエリパフォーマンス (<500ms, 10万レコード)
  - ✅ データ正確性検証
  - ✅ Swagger ドキュメント
- **見積もり**: 3時間
- **出力ファイル**: `apps/api/src/modules/analytics/analytics.service.ts`, `apps/api/src/modules/analytics/dto/*.dto.ts`
- **依存関係**: Week 3 [W3-005] 完了

---

### [W4-005] ダッシュボードグラフ実装 (Recharts) 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/web/src/app/(dashboard)/page.tsx` にグラフ追加:
  - 折れ線: 日次チャット数 (7日間)
  - 円: AI応答 vs エスカレーション比率
  - 棒: FAQ使用回数トップ10
  - 数値カード: 合計チャット数、平均信頼度、アクティブユーザー数
- **受け入れ基準**:
  - ✅ React Query で Analytics API データ取得
  - ✅ Recharts でグラフ描画
  - ✅ レスポンシブデザイン
  - ✅ ローディング/エラー状態
  - ✅ リアルタイム更新 (30秒ごと refetch)
- **見積もり**: 3時間
- **出力ファイル**: `apps/web/src/app/(dashboard)/page.tsx`, `apps/web/src/components/dashboard/charts/*.tsx`
- **依存関係**: [W4-004] 完了

---

### [W4-006] 埋め込みウィジェットスクリプト作成 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/widget` パッケージ作成。1行スクリプト (`<script src="https://cdn.chatbot-saas.com/widget.js" data-tenant-id="xxx"></script>`) でチャットウィンドウ埋め込み。Shadow DOM で CSS 分離。
- **受け入れ基準**:
  - ✅ スクリプト初期化 (<1秒)
  - ✅ チャットウィンドウ表示 (右下フローティング)
  - ✅ テナント ID 検証
  - ✅ WebSocket 接続 (本番 API)
  - ✅ CSS 分離 (Shadow DOM)
  - ✅ CORS 設定 (許可ドメイン: テナント設定)
- **見積もり**: 4時間
- **出力ファイル**: `apps/widget/src/index.ts`, `apps/widget/dist/widget.js`, `docs/EMBED_GUIDE.md`
- **依存関係**: Week 3 WebSocket 完了

---

### [W4-007] ウィジェット管理ページ (コピペコード生成) 🔴 TODO
- **優先度**: P1
- **詳細**: `apps/web/src/app/(dashboard)/embed/page.tsx` 作成。機能: テナント ID 自動取得、埋め込みコード表示 (コピーボタン)、カスタマイズ (色、位置、初期メッセージ)、プレビュー (iframe)。
- **受け入れ基準**:
  - ✅ 埋め込みコード生成 (テナント ID 含む)
  - ✅ コピーボタン動作 (Clipboard API)
  - ✅ カスタマイズフォーム (色: HEX, 位置: 左下/右下, 初期メッセージ)
  - ✅ プレビュー動作 (iframe)
  - ✅ 許可ドメイン設定 (CORS)
- **見積もり**: 2時間
- **出力ファイル**: `apps/web/src/app/(dashboard)/embed/page.tsx`, `apps/web/src/components/embed/code-snippet.tsx`
- **依存関係**: [W4-006] 完了

---

### [W4-008] Rate Limiting 実装 (IP & ユーザーベース) 🔴 TODO
- **優先度**: P0
- **詳細**: `rate-limiter-flexible` + Redis で制限:
  - IP: 100 req/min (認証不要)
  - ユーザー: 1000 req/min (認証済み)
  - AI チャット: 20 req/min (Gemini コスト対策)
- **受け入れ基準**:
  - ✅ Rate Limit 超過時 429 レスポンス
  - ✅ ヘッダー (`X-RateLimit-*`)
  - ✅ Redis 接続確認
  - ✅ ユニットテスト
- **見積もり**: 2時間
- **出力ファイル**: `apps/api/src/middlewares/rate-limiter.middleware.ts`
- **依存関係**: Week 3 Redis 完了

---

### [W4-009] CORS & Helmet セキュリティヘッダー設定 🔴 TODO
- **優先度**: P0
- **詳細**: NestJS で `@nestjs/cors`, `helmet` 設定。CORS: Vercel ドメイン + テナント許可ドメイン。Helmet: CSP, X-Frame-Options, HSTS 有効化。
- **受け入れ基準**:
  - ✅ CORS 動作確認 (Postman)
  - ✅ Helmet ヘッダー出力
  - ✅ CSP 違反テスト
  - ✅ セキュリティ診断 (OWASP ZAP)
- **見積もり**: 1時間
- **出力ファイル**: `apps/api/src/main.ts` (CORS/Helmet 設定)
- **依存関係**: Week 2 完了

---

### [W4-010] SQL Injection & XSS 対策確認 🔴 TODO
- **優先度**: P0
- **詳細**: 全エンドポイント検証:
  - **SQL Injection**: Prisma パラメータ化クエリ確認、生SQL (`$queryRaw`) で `Prisma.sql` タグ使用
  - **XSS**: DOM 挿入箇所特定、React 自動エスケープ確認、`dangerouslySetInnerHTML` に `DOMPurify`
- **受け入れ基準**:
  - ✅ Prisma クエリ全件レビュー (生SQL 0件)
  - ✅ XSS テスト (ペイロード: `<script>alert(1)</script>`)
  - ✅ DOMPurify 統合
  - ✅ セキュリティチェックリスト作成
- **見積もり**: 2時間
- **出力ファイル**: `docs/SECURITY_CHECKLIST.md`, `apps/web/src/utils/sanitize.ts`
- **依存関係**: Week 2-3 完了

---

### [W4-011] E2E テストスイート完成 (Playwright) 🔴 TODO
- **優先度**: P1
- **詳細**: Playwright で主要フロー10件自動テスト:
  1. ユーザー登録・ログイン
  2. FAQ作成・編集・削除
  3. FAQ検索 (セマンティック)
  4. AIチャット応答 (RAG)
  5. WebSocket メッセージ送受信
  6. ダッシュボード表示
  7. 埋め込みコード生成
  8. LINE Bot メッセージ送信
  9. Analytics グラフ表示
  10. テナント設定保存
- **受け入れ基準**:
  - ✅ 全10フロー自動テスト成功
  - ✅ CI/CD 統合 (GitHub Actions)
  - ✅ スクリーンショット比較 (Visual Regression)
  - ✅ テストレポート生成 (HTML)
- **見積もり**: 4時間
- **出力ファイル**: `apps/web/tests/e2e/*.spec.ts`, `.github/workflows/e2e-tests.yml`
- **依存関係**: Week 3-4 主要機能 完了

---

### [W4-012] API ドキュメント完成 (Swagger/OpenAPI) 🔴 TODO
- **優先度**: P1
- **詳細**: 全エンドポイントに `@ApiOperation`, `@ApiResponse`, `@ApiBody` デコレータ追加。Swagger UI (`http://localhost:4000/api/docs`) 確認。
- **受け入れ基準**:
  - ✅ 全エンドポイント文書化 (30+ エンドポイント)
  - ✅ DTO に `@ApiProperty` 追加
  - ✅ 認証スキーム設定 (`@ApiBearerAuth()`)
  - ✅ Swagger JSON エクスポート (`docs/openapi.json`)
- **見積もり**: 2時間
- **出力ファイル**: `apps/api/src/**/*.controller.ts`, `docs/openapi.json`
- **依存関係**: Week 2-4 API 完了

---

### [W4-013] ユーザーマニュアル作成 (Markdown) 🔴 TODO
- **優先度**: P2
- **詳細**: `docs/USER_MANUAL.md` 作成。内容: アカウント登録・ログイン、FAQ管理、AI設定 (2業種)、埋め込みウィジェット、LINE Bot 連携、ダッシュボード、トラブルシューティング。
- **受け入れ基準**:
  - ✅ 全機能カバー (10セクション)
  - ✅ スクリーンショット付き (20枚+)
  - ✅ 目次・検索インデックス
  - ✅ PDF 版生成 (`pandoc`)
- **見積もり**: 3時間
- **出力ファイル**: `docs/USER_MANUAL.md`, `docs/USER_MANUAL.pdf`
- **依存関係**: Week 4 主要機能 完了

---

### [W4-014] Week 4 完了レビュー & Month 2 準備 🔴 TODO
- **優先度**: P0
- **詳細**: Week 3-4 の全27タスク完了確認。チェックリスト: 全タスク DONE、ブランチマージ、ドキュメント更新、デプロイ動作確認、統合テスト成功、コードレビュー完了。Month 2 タスクリスト確認。
- **受け入れ基準**:
  - ✅ 全27タスク DONE マーク
  - ✅ GitHub ブランチ (`week-3-4`) マージ完了
  - ✅ README, BACKLOG, AGENTS.md 更新
  - ✅ Vercel + GCP デプロイ動作確認
  - ✅ Week 1-4 統合テスト成功
  - ✅ コードレビュー完了 (最低1名)
  - ✅ memory-bank 更新 (`week-3-4-summary.md`)
- **見積もり**: 1時間
- **出力ファイル**: `memory-bank/progress/week-3-4-summary.md`, `BACKLOG.md` (Month 2 タスク追加)
- **依存関係**: [W4-001]~[W4-013] 完了

---

## 📊 Month 2-3 概要 (スケルトン、詳細化は Week 4 完了後)

### Month 2 (15タスク, 30h見積もり) ⏳
- **テーマ**: マルチテナント完全化、パフォーマンス最適化、Stripe 決済統合
- **主要タスク**:
  - テナント完全分離 (RLS 強化、DB インデックス最適化)
  - Stripe サブスクリプション API (Checkout, Webhook, プラン管理)
  - パフォーマンス最適化 (Next.js ISR, API キャッシュ、画像最適化)
  - セルフサービスオンボーディング (サインアップ → FAQ インポート → 埋め込みコード生成)
  - 負荷テスト & 最適化 (k6, 1000同時接続)

### Month 3 (14タスク, 28h見積もり) ⏳
- **テーマ**: 本番リリース、監視強化、スケーラビリティ、エンタープライズ機能
- **主要タスク**:
  - GCP 本番環境構築 (Terraform, Cloud Run Auto-scaling)
  - CI/CD 完全自動化 (GitHub Actions, Blue-Green デプロイ)
  - Sentry + Cloud Monitoring 統合
  - エンタープライズ機能 (SSO, 監査ログ, ホワイトラベル)
  - 正式リリース & 投資家ピッチ準備

---

## 🎯 成功指標 (Month 6 目標)

| 指標 | 目標 | 現状 (Week 2) |
|------|------|--------------|
| **MRR** | ¥620,000 (40社) | ¥0 (開発中) |
| **顧客数** | 40社 | 0社 |
| **Churn率** | <2.5% | - |
| **NRR** | >103% | - |
| **FAQ正答率** | >90% | 97% (10問テスト) ✅ |
| **API応答時間** | <2秒 (P95) | 1.2秒 (Gemini) ✅ |
| **WebSocket遅延** | <200ms | 120ms ✅ |
| **稼働率** | >99.95% | - |
| **テストカバレッジ** | >80% | 82% ✅ |

---

## 📝 次のアクション

### 即実行タスク (Week 3 開始)
1. **[W3-001] LangChain.js セットアップ** → Genspark AIデベロッパーに投げる
2. **[W3-002] 業種別プロンプト作成** (ペットショップ + 動物病院)
3. **[W3-003] RAGパイプライン実装**

### Week 3 完了後
- Week 4 タスク開始 (LINE Bot, Analytics, 埋め込みウィジェット)
- Month 2 タスク詳細化

### リリース準備 (Month 3)
- GCP 本番環境構築
- 投資家ピッチ資料作成
- 3社パイロット顧客獲得

---

## 📂 関連ドキュメント
- `BRD_PRD.md` - ビジネス要件
- `AGENTS.md` - AI エージェント運用ルール
- `apps/web/AGENTS.md` - フロントエンド実装ガイド
- `apps/api/AGENTS.md` - バックエンド実装ガイド
- `memory-bank/README.md` - コンテキスト管理
- `docs/TECH_STACK.md` - 技術スタック詳細
- `docs/API_SPEC.md` - API 仕様書 (Swagger)

---

**最終更新**: 2025-02-18  
**次回更新**: Week 3 完了時 (Week 4 タスク詳細化)
