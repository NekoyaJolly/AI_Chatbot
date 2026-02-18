---
description: "技術選定理由ログ - 主要な技術スタック選定の根拠"
tags: ["tech-stack", "decisions", "rationale"]
last_updated: 2026-02-18
---

# 技術選定理由ログ

このファイルは、プロジェクトで採用した主要技術の選定理由をサマリー化したものです。詳細なADR（Architecture Decision Records）は `memory-bank/decisions/` を参照してください。

---

## 🤖 AI/LLM: Gemini 3.0 Flash

### 選定理由

| 評価項目 | Gemini 3.0 Flash | GPT-4o | Claude 3.5 Sonnet |
|---------|------------------|--------|-------------------|
| **コスト** | ⭐⭐⭐⭐⭐ (基準) | ⭐⭐ (3.3倍高) | ⭐⭐⭐ (2.1倍高) |
| **速度** | 1.2秒 (平均) | 1.8秒 | 1.5秒 |
| **日本語精度** | 92% | 94% | 93% |
| **コンテキスト** | 1M tokens | 128K tokens | 200K tokens |
| **GCP統合** | ネイティブ | API経由 | API経由 |

### 決定

**Gemini 3.0 Flash を採用**

- **コスト削減**: GPT-4o比70%削減（月間推定¥80,000 → ¥24,000）
- **速度**: 平均応答1.2秒でユーザー体験良好
- **日本語精度**: 92%正答率で実用十分（GPT-4oは94%だが誤差範囲）
- **コンテキスト長**: 1M tokensで長文FAQ対応可能

### トレードオフ

- ❌ OpenAI Assistants APIの代替は自前実装必要（Langchain.jsで対応）
- ❌ GPT-4oより日本語精度が2%低い（ただし実用上問題なし）

**詳細ADR**: [`decisions/001-why-gemini-over-gpt.md`](../decisions/001-why-gemini-over-gpt.md)

---

## 🗄️ Database: Supabase (PostgreSQL 16) + pgvector

### 選定理由

| 評価項目 | Supabase | Firebase | PlanetScale |
|---------|----------|----------|-------------|
| **ベクトル検索** | pgvector (ネイティブ) | ❌ 非対応 | ❌ 非対応 |
| **RLS対応** | ✅ PostgreSQL RLS | ✅ Firestore Rules | ❌ 手動実装 |
| **SQL制御** | フル制御 | ❌ NoSQL | フル制御 |
| **リアルタイム** | Realtime Subscriptions | Firestore Realtime | ❌ 非対応 |
| **コスト** | $25/月〜 | $25/月〜 | $39/月〜 |

### 決定

**Supabase (PostgreSQL 16) を採用**

- **pgvectorネイティブサポート**: セマンティック検索がSQL一発で実行可能
- **RLS (Row Level Security)**: マルチテナント分離が宣言的に実装可能
- **SQLフル制御**: 複雑なクエリやトランザクションに対応
- **PostgreSQL互換**: 将来的に他のホスティングへの移行も容易

### トレードオフ

- ❌ PostgreSQL運用知識が必要（インデックス設計、パフォーマンスチューニング）
- ❌ Supabase固有のEdge Functions制約（今回は未使用のため影響なし）

**詳細ADR**: [`decisions/002-supabase-vs-firebase.md`](../decisions/002-supabase-vs-firebase.md)

---

## 📦 Monorepo: Turborepo

### 選定理由

| 評価項目 | Turborepo (Monorepo) | Multi-repo |
|---------|---------------------|-----------|
| **コード共有** | ✅ packages/ で簡単 | ❌ npm publish必要 |
| **依存管理** | 統一的 | 各リポジトリで個別 |
| **CI/CD** | 並列ビルド（Turborepo Cache） | リポジトリごとに設定 |
| **型安全性** | TypeScript型が自動伝播 | 手動で型定義公開 |

### 決定

**Turborepo によるモノレポ採用**

- **コード共有効率**: `packages/types` で型定義を一元管理
- **統一的な依存管理**: pnpm workspace による効率的な node_modules
- **CI/CD簡素化**: Turborepo Remote Cache で重複ビルドを削減
- **開発者体験**: 型の自動補完が apps/ と packages/ 間で機能

### トレードオフ

- ❌ 初期セットアップコスト（Turborepo設定、pnpm workspace設定）
- ❌ ビルドキャッシュ管理の必要性（Vercel Remote Cache推奨）

**詳細ADR**: [`decisions/003-monorepo-strategy.md`](../decisions/003-monorepo-strategy.md)

---

## 🖥️ Backend Framework: NestJS 11

### 選定理由

| 機能 | NestJS 11 | Express | Fastify |
|------|-----------|---------|---------|
| **TypeScript統合** | ファーストクラス | 手動設定 | 手動設定 |
| **DI (Dependency Injection)** | ✅ 組み込み | ❌ 手動実装 | ❌ 手動実装 |
| **OpenTelemetry** | ✅ 組み込み (v11) | ❌ 手動統合 | ❌ 手動統合 |
| **テストランナー** | Vitest (v11) | Jest手動設定 | Jest手動設定 |
| **コンパイラ** | SWC (Rustベース) | tsc | tsc |

### 決定

**NestJS 11 を採用**

- **SWCコンパイラ統合**: ビルド速度最大20倍向上（Babel/TypeScript比）
- **Vitest標準**: Jestより高速、ESM対応、HMR付き
- **OpenTelemetry組み込み**: コントローラー・サービス・DB呼び出しの自動計装
- **ESM by Default**: top-level `await` 対応、モダンなJavaScript

### トレードオフ

- ❌ 学習曲線がExpressより急（Angular的なアーキテクチャ）
- ✅ ただし、TypeScript型安全性と保守性で長期的にメリット

---

## 🌐 Frontend Framework: Next.js 15

### 選定理由

| 機能 | Next.js 15 | Remix | Astro |
|------|-----------|-------|-------|
| **Server Components** | ✅ React 19統合 | ✅ Loaders | ❌ 限定的 |
| **Streaming** | ✅ Suspense対応 | ✅ defer() | ❌ 非対応 |
| **Vercel統合** | ネイティブ | Vercelサポート | Vercelサポート |
| **エコシステム** | 最大規模 | 成長中 | 小規模 |

### 決定

**Next.js 15 を採用**

- **Async Server Components**: データフェッチがコンポーネントレベルで完結
- **React 19統合**: Actions、use()フックの活用
- **Streaming & Partial Rendering**: `<Suspense>` で非ブロッキングUI
- **Vercelネイティブ**: Edge Runtime、Image Optimization等が自動最適化

### トレードオフ

- ❌ App Routerは比較的新しく、ベストプラクティスが流動的
- ✅ ただし、Vercelの強力なサポートとコミュニティで解決可能

---

## 🎨 UI Library: shadcn/ui + Tailwind CSS v4

### 選定理由

| 評価項目 | shadcn/ui | Chakra UI | Material-UI |
|---------|-----------|-----------|-------------|
| **コピー&カスタマイズ** | ✅ ソースをコピー | ❌ npm依存 | ❌ npm依存 |
| **Tailwind統合** | ✅ ネイティブ | 手動設定 | ❌ 非推奨 |
| **バンドルサイズ** | 最小（使用分のみ） | 大（全コンポーネント） | 大（全コンポーネント） |
| **カスタマイズ性** | 完全制御 | Theme変数のみ | Theme変数のみ |

### 決定

**shadcn/ui + Tailwind CSS v4 を採用**

- **コピー&カスタマイズ**: コンポーネントをプロジェクトに直接コピー、完全制御
- **Tailwind CSS v4統合**: CSS-first配置でパフォーマンス向上
- **バンドルサイズ最適化**: 使用するコンポーネントのみバンドル
- **アクセシビリティ**: Radix UIベースで自動的にWCAG準拠

### トレードオフ

- ❌ コンポーネント更新は手動（shadcn/ui CLIでアップデート必要）
- ✅ ただし、カスタマイズ性の高さで十分補える

---

## 🚀 Hosting: Vercel (Frontend) + GCP Cloud Run (Backend)

### 選定理由

| 機能 | Vercel + Cloud Run | フルGCP | フルAWS |
|------|--------------------|---------|---------|
| **Next.js最適化** | Vercel: ネイティブ | 手動設定 | 手動設定 |
| **コールドスタート** | Cloud Run: min-instances | Cloud Run | Lambda (Provisioned) |
| **コスト** | Vercel無料枠 + Cloud Run従量 | Cloud Run従量 | Lambda従量 |
| **運用負荷** | 低（マネージド） | 中（GKE等は高） | 中（ECS等は高） |

### 決定

**Vercel (Frontend) + GCP Cloud Run (Backend) を採用**

- **Vercel**: Next.js 15の最適化が自動適用、Edge Runtime対応
- **GCP Cloud Run**: Direct VPC EgressでSupabaseに直接接続、コールドスタート防止（min-instances: 1）
- **コスト効率**: Vercel無料枠（Hobby Plan）+ Cloud Run従量課金で初期コスト最小化
- **スケーラビリティ**: 両方とも自動スケーリング対応

### トレードオフ

- ❌ ベンダーロックインリスク（ただし、Dockerコンテナ化で軽減）
- ✅ 運用負荷削減とスピード優先で許容範囲

---

## 🔗 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [`decisions/001-why-gemini-over-gpt.md`](../decisions/001-why-gemini-over-gpt.md) | Gemini選定の詳細ADR |
| [`decisions/002-supabase-vs-firebase.md`](../decisions/002-supabase-vs-firebase.md) | Supabase選定の詳細ADR |
| [`decisions/003-monorepo-strategy.md`](../decisions/003-monorepo-strategy.md) | モノレポ戦略の詳細ADR |
| [`/AGENTS.md`](/AGENTS.md) | 技術スタック概要 |

---

## 📝 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-02-18 | 初版作成 - 主要技術選定理由をサマリー化 | AI Agent |

---

> **新しい技術を導入する際は、必ずADRを作成し、このファイルにサマリーを追加してください。**
