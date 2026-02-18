---
description: "AI Chatbot SaaS Platform - プロジェクト全体概要"
tags: ["project-overview", "business-goals", "tech-stack", "roadmap"]
last_updated: 2026-02-18
status: active
---

# プロジェクト全体概要

## 🎯 ビジネス目標

**中小企業向け完全マネージド型AIチャットボットSaaS**を6ヶ月で構築し、シード資金調達（¥50M-200M）を目指す。

### コアバリュープロポジション

1. **完全マネージド**: インフラ・AI・分析まで一括提供
2. **業種特化**: ペットショップ、美容サロン、動物病院等に最適化
3. **高速導入**: 最短1日で運用開始可能
4. **高精度AI**: Gemini 3.0 Flash + RAGによる正答率90%以上

---

## 🏢 ターゲット市場

### Primary Market（優先ターゲット）

| 業種 | 店舗数 | 特徴 |
|------|--------|------|
| ペットショップ | 約4,500店 | 専門知識が必要（犬種、キャットフード等） |
| 美容サロン | 約250,000店 | 予約確認、施術内容説明が多い |
| 動物病院 | 約12,000店 | 緊急性判断、診療時間案内が重要 |

### Secondary Market（第二ターゲット）

| 業種 | 店舗数 | 展開時期 |
|------|--------|---------|
| 飲食店 | 約500,000店 | Month 3以降 |
| 不動産 | 約120,000店 | Month 4以降 |
| 歯科医院 | 約68,000店 | Month 5以降 |
| 学習塾 | 約50,000店 | Month 6以降 |

### Total Addressable Market (TAM)

```yaml
総店舗数: 約1,250,000店
想定月額単価: ¥15,000
TAM: ¥1.875兆円/年 (1,250,000 × ¥15,000 × 12ヶ月)
```

---

## 🛠️ 技術スタック（2026年標準）

### Frontend

```yaml
Framework: Next.js 15
  - Async Server Components
  - React 19統合
  - App Router (pages/ディレクトリ非推奨)
UI Library: shadcn/ui
Styling: Tailwind CSS v4
  - CSS-first配置ベースデザイン
  - JITコンパイラによる高速ビルド
Hosting: Vercel
  - Edge Runtimeサポート
  - 自動プレビューデプロイ
```

### Backend

```yaml
Framework: NestJS 11
  - SWCコンパイラ（Rustベース、ビルド速度20倍）
  - Vitest標準（Jest非推奨）
  - OpenTelemetry組み込み
  - ESM by Default
AI/LLM: Gemini 3.0 Flash + Langchain.js
  - コスト: GPT-4o比70%削減
  - 速度: 平均1.2秒応答
  - 日本語精度: 92%正答率
Hosting: GCP Cloud Run
  - Direct VPC Egress（Supabase直接接続）
  - min-instances: 1（コールドスタート防止）
```

### Database & Cache

```yaml
Primary DB: PostgreSQL 16 (Supabase)
  - pgvector: セマンティック検索（OpenAI Embeddings互換）
  - Row Level Security (RLS): マルチテナント分離
  - Realtime Subscriptions: WebSocketサポート
Cache: Redis 7 (GCP Memorystore)
  - FAQ結果キャッシュ（TTL: 5分）
  - セッション管理
ORM: Prisma
  - TypeScript型自動生成
  - マイグレーション管理
```

### Infrastructure & DevOps

```yaml
IaC: Terraform
  - GCP Cloud Run
  - Memorystore (Redis)
  - Secret Manager
CI/CD: GitHub Actions
  - Turborepo Remote Cache
  - 並列テスト実行（Vitest）
Monitoring:
  - OpenTelemetry（NestJS 11組み込み）
  - GCP Cloud Logging
  - Sentry（エラー追跡）
```

---

## 🗓️ 6ヶ月ロードマップ

### Month 1-2: MVP開発

**目標**: 5社獲得、基本機能完成

| Week | 主要タスク | 成果物 |
|------|----------|--------|
| Week 1 | 技術検証 & 環境構築 | Monorepo、Gemini API動作確認 |
| Week 2-3 | コアAPI実装 | 認証、FAQ CRUD、RAG基本実装 |
| Week 4-5 | フロントエンド開発 | 管理画面、チャットUI |
| Week 6-8 | LINE連携 & テスト | Webhook統合、E2Eテスト |

**KPI（Month 2完了時）**:
- ✅ 導入企業: 5社
- ✅ FAQ正答率: > 85%
- ✅ API応答速度: P95 < 200ms

### Month 3-4: β版展開

**目標**: 20社獲得、多業種対応

| 機能 | 内容 |
|------|------|
| プロンプトテンプレート化 | 業種別の回答スタイル設定 |
| 埋め込みウィジェット | 既存WebサイトへのJavaScript埋め込み |
| 分析ダッシュボード強化 | チャート可視化、CSV出力 |

**KPI（Month 4完了時）**:
- ✅ 導入企業: 20社
- ✅ 業種カバレッジ: 3業種以上
- ✅ Churn Rate: < 5%

### Month 5-6: 正式版 & 投資家ピッチ

**目標**: 40社獲得、シード資金調達

| 機能 | 内容 |
|------|------|
| 決済統合 | Stripe Connect（サブスクリプション） |
| マルチチャネル | Instagram DM、Facebook Messenger対応 |
| 高度な分析 | コンバージョン追跡、A/Bテスト |

**KPI（Month 6完了時）**:
- ✅ 導入企業: 40社
- ✅ MRR: ¥620,000（40社 × ¥15,500平均）
- ✅ Churn Rate: < 2.5%
- ✅ Net Revenue Retention (NRR): > 103%
- ✅ FAQ正答率: > 90%
- ✅ API応答速度: < 2秒（AI推論含む）

---

## 📊 成功指標（Success Criteria）

### Week 1完了時

- [ ] Turborepo Monorepo構築完了
- [ ] Supabase + pgvector セマンティック検索 動作確認
- [ ] Gemini API 応答速度 < 3秒
- [ ] Next.js 15 / NestJS 11 初期起動確認
- [ ] WebSocket Echo サーバー動作確認
- [ ] 全タスク人間承認済み
- [ ] GitHub リポジトリに Week1 ブランチマージ

### Month 6完了時（投資家ピッチ準備）

| カテゴリ | 目標値 | 測定方法 |
|---------|--------|---------|
| **ビジネス** | MRR ¥620,000 | Stripe ダッシュボード |
| | Churn Rate < 2.5% | 月次解約率 |
| | NRR > 103% | (MRR + Expansion - Churn) / MRR |
| **技術** | FAQ正答率 > 90% | 人間評価（サンプル100件） |
| | API応答速度 < 2秒 | OpenTelemetry P95計測 |
| | 稼働率 > 99.95% | GCP Cloud Monitoring |
| **ユーザー** | 導入企業 40社 | CRM管理 |
| | DAU/MAU > 60% | 分析ダッシュボード |

---

## 🔗 関連ドキュメント

| ドキュメント | 説明 | 更新頻度 |
|-------------|------|---------|
| [`/AGENTS.md`](/AGENTS.md) | AI開発者向け共通ルール | 低（月1回） |
| [`/BRD_PRD.md`](/BRD_PRD.md) | ビジネス・プロダクト要件定義書 | 中（Week2回） |
| [`/BACKLOG.md`](/BACKLOG.md) | タスクバックログ | 高（毎日） |
| [`tech-decisions.md`](./tech-decisions.md) | 技術選定理由ログ | 低（重要決定時） |
| [`business-requirements.md`](./business-requirements.md) | ビジネス要件サマリー | 低（要件変更時） |

---

## 📝 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-02-18 | Memory Bank初期構築、プロジェクト概要作成 | AI Agent |

---

> **このファイルはプロジェクトの「北極星」です。** すべてのタスクはこのビジョンに沿って実行されます。変更が必要な場合は、人間の承認を得てから更新してください。
