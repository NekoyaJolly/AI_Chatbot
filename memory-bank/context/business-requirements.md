---
description: "ビジネス要件サマリー - MVP機能と非機能要件"
tags: ["business-requirements", "mvp", "features", "non-functional"]
last_updated: 2026-02-18
---

# ビジネス要件サマリー

このファイルは、BRD_PRD.md からのビジネス要件を抽出・サマリー化したものです。詳細は `/BRD_PRD.md` を参照してください。

---

## 🎯 MVP（Minimum Viable Product）主要機能

### 1. マルチテナント管理

**概要**: 複数企業のデータを完全分離して管理

| 要件 | 実装方法 |
|------|---------|
| データ分離 | PostgreSQL Row Level Security (RLS) |
| テナント識別 | JWT内のテナントID (`tenant_id`) |
| クエリ自動フィルタ | RLS Policy で `current_setting('app.tenant_id')` による自動制御 |
| 管理画面 | テナントごとの専用ダッシュボード |

**セキュリティ要件**:
- ✅ テナント間のデータ漏洩を防止
- ✅ 全SQLクエリに自動的にテナントフィルタを適用
- ✅ 管理者も他テナントのデータにアクセス不可（Super Admin除く）

---

### 2. FAQ管理システム

**概要**: Q&A形式のナレッジベース管理

| 機能 | 詳細 |
|------|------|
| CRUD操作 | 質問・回答の作成・編集・削除 |
| カテゴリ管理 | 階層的なカテゴリ分類 |
| CSVインポート | 既存FAQの一括登録 |
| セマンティック検索 | pgvector + OpenAI Embeddings（text-embedding-3-small） |
| 検索精度 | コサイン類似度 > 0.7 を関連FAQとして返す |

**パフォーマンス要件**:
- ✅ pgvector検索: P95 < 100ms
- ✅ CRUD操作: P95 < 200ms
- ✅ CSVインポート: 1,000件/分以上

**データ構造**:
```sql
CREATE TABLE faqs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category_id UUID,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_faqs_embedding ON faqs USING ivfflat (embedding vector_cosine_ops);
```

---

### 3. AIチャット応答生成（RAG）

**概要**: Gemini 3.0 Flash + RAGによる高精度チャット応答

| コンポーネント | 実装 |
|--------------|------|
| LLM | Gemini 3.0 Flash (1M context) |
| Retrieval | pgvector セマンティック検索（Top-K=5） |
| Prompt Template | Langchain.js PromptTemplate |
| Streaming | Server-Sent Events (SSE) |

**処理フロー**:
1. ユーザー質問を受信
2. OpenAI Embeddings API で質問をベクトル化
3. pgvectorでコサイン類似度検索（Top-5）
4. 検索結果をコンテキストとしてGemini APIに送信
5. Geminiの応答をストリーミング返却

**品質要件**:
- ✅ FAQ正答率: > 90%（人間評価）
- ✅ 応答速度: P95 < 2秒（Retrieval + LLM推論含む）
- ✅ 幻覚（Hallucination）率: < 5%

---

### 4. リアルタイムチャット

**概要**: WebSocket（Socket.io）による双方向チャット

| 機能 | 実装 |
|------|------|
| WebSocket通信 | Socket.io (NestJS WebSocketGateway) |
| 既読管理 | チャットメッセージごとの既読フラグ |
| タイピングインジケーター | `typing` イベントの送受信 |
| 接続管理 | Redis Adapter でマルチインスタンス対応 |

**パフォーマンス要件**:
- ✅ WebSocket接続確立: < 500ms
- ✅ メッセージ配信レイテンシー: < 100ms
- ✅ 同時接続数: 最大10,000接続/インスタンス

---

### 5. LINE連携

**概要**: LINE Messaging APIとのWebhook統合

| 機能 | 実装 |
|------|------|
| Webhook受信 | POST /webhooks/line |
| メッセージ送信 | LINE Messaging API Push Message |
| リッチメニュー | LINE Bot 用カスタムメニュー |
| 署名検証 | X-Line-Signature ヘッダー検証 |

**セキュリティ要件**:
- ✅ Webhook署名検証必須
- ✅ LINE User IDとテナント内部ユーザーIDのマッピング
- ✅ Rate Limiting（LINE API制限: 500req/sec準拠）

---

### 6. 分析ダッシュボード

**概要**: チャット統計とFAQ正答率の可視化

| 指標 | 表示形式 |
|------|---------|
| チャット総数 | 折れ線グラフ（日次・週次・月次） |
| FAQ正答率 | 円グラフ（正答・不正答・未判定） |
| 人気FAQ Top 10 | 棒グラフ |
| 平均応答速度 | P50/P95/P99をカード表示 |

**可視化ライブラリ**: Recharts（React 19互換）

**データ取得**:
- Supabase Realtime Subscriptions でリアルタイム更新
- 集計クエリはRedisキャッシュ（TTL: 5分）

---

### 7. 埋め込みウィジェット

**概要**: 既存Webサイトへの簡単埋め込み

| 機能 | 実装 |
|------|------|
| Shadow DOM | スタイル隔離 |
| JavaScript埋め込み | `<script src="...">` 1行で導入 |
| カスタマイズ | テーマカラー、位置、サイズ設定 |
| レスポンシブ | モバイル・タブレット・デスクトップ対応 |

**配信方法**:
- Vercel Edge Network 経由でグローバル配信
- CDN キャッシュ（Cache-Control: max-age=3600）

---

## 🔐 非機能要件

### セキュリティ

| 項目 | 要件 |
|------|------|
| 認証 | JWT (Access Token + Refresh Token) |
| 認可 | NestJS Guard ベース、全エンドポイントデフォルト認証 |
| Rate Limiting | Redis + @nestjs/throttler（100req/min/IP） |
| OWASP Top 10対策 | SQL Injection (Prisma)、XSS (DOMPurify)、CSRF (SameSite Cookie) |
| 秘密情報管理 | GCP Secret Manager、`.env` ファイルコミット禁止 |

### パフォーマンス

| API | 目標応答時間 (P95) |
|-----|-------------------|
| GET /faqs | < 200ms |
| POST /chat/completion | < 2,000ms (AI推論含む) |
| GET /analytics/dashboard | < 500ms (Redisキャッシュ活用) |
| WebSocket接続確立 | < 500ms |

**pgvectorセマンティック検索**: P95 < 100ms

### 可用性

| 指標 | 目標値 |
|------|--------|
| 稼働率 | 99.95% (年間ダウンタイム < 4.38時間) |
| MTTR (平均復旧時間) | < 15分 |
| バックアップ | 日次自動バックアップ (Supabase) |
| ディザスタリカバリ | RTO < 1時間、RPO < 5分 |

---

## 📊 成功指標（KPI）

### ビジネスKPI

| 指標 | Month 2目標 | Month 6目標 |
|------|------------|------------|
| 導入企業数 | 5社 | 40社 |
| MRR | ¥77,500 | ¥620,000 |
| Churn Rate | < 5% | < 2.5% |
| NRR | > 100% | > 103% |

### 技術KPI

| 指標 | 目標値 | 測定方法 |
|------|--------|---------|
| FAQ正答率 | > 90% | 人間評価（サンプル100件） |
| API応答速度 | P95 < 200ms | OpenTelemetry |
| AI応答速度 | P95 < 2秒 | OpenTelemetry |
| 稼働率 | > 99.95% | GCP Cloud Monitoring |

---

## 🔗 関連ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [`/BRD_PRD.md`](/BRD_PRD.md) | ビジネス・プロダクト要件定義書（詳細版） |
| [`project-overview.md`](./project-overview.md) | プロジェクト全体概要 |
| [`/BACKLOG.md`](/BACKLOG.md) | タスクバックログ |

---

## 📝 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-02-18 | 初版作成 - BRD_PRD.md からビジネス要件を抽出 | AI Agent |

---

> **要件変更時は、必ず BRD_PRD.md を更新後、このファイルにも反映してください。**
