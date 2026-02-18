# Supabase セットアップガイド

## 概要

このドキュメントは AI Chatbot SaaS プロジェクトの Supabase 設定手順を説明します。

---

## 1. プロジェクト作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. 「New project」をクリック
3. 以下の設定でプロジェクトを作成:
   - **Project name**: `ai-chatbot-saas`
   - **Database password**: 強力なパスワードを設定 (記録しておく)
   - **Region**: `Northeast Asia (Tokyo)` または `Southeast Asia (Singapore)`
4. プロジェクト作成完了まで約2分待機

---

## 2. 接続情報の取得

**Settings > API** にアクセスし、以下を取得:

| 変数名 | 取得場所 |
|--------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | `anon` `public` キー |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` キー (秘密扱い) |

**Settings > Database > Connection string > URI** から:

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Prisma 接続用 URI (Transaction pooler推奨) |
| `DIRECT_URL` | マイグレーション専用 (Session mode) |

> **注意**: `DATABASE_URL` はコネクションプーラー経由のURLを使用。
> マイグレーション時は `DIRECT_URL` にダイレクト接続URLを設定。

---

## 3. pgvector 拡張インストール

**SQL Editor** で以下を実行:

```sql
-- pgvector 拡張インストール (ベクトル類似検索)
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm 拡張インストール (トライグラム全文検索)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- uuid-ossp 拡張インストール (UUID生成)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 拡張確認
SELECT * FROM pg_extension WHERE extname IN ('vector', 'pg_trgm', 'uuid-ossp');
```

---

## 4. Row Level Security (RLS) 基本設定

Prisma Middleware でテナント分離を実装するため、Supabase の RLS は補助的に設定します。

```sql
-- テーブル作成後、必要に応じてRLSを有効化
-- ALTER TABLE tenant_faqs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

---

## 5. pgvector 動作テスト

```sql
-- テスト用テーブル作成
CREATE TABLE IF NOT EXISTS test_embeddings (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536)
);

-- テストデータ挿入 (次元数は実際の埋め込みモデルに合わせる)
-- Gemini text-embedding-004 は 768次元
-- OpenAI text-embedding-ada-002 は 1536次元
INSERT INTO test_embeddings (content, embedding)
VALUES (
  'テストコンテンツ',
  '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',') || ']'
);

-- ベクトル検索テスト
SELECT id, content, embedding <=> '[' || array_to_string(array_fill(0.1::float8, ARRAY[1536]), ',') || ']' as distance
FROM test_embeddings
ORDER BY distance
LIMIT 5;

-- テストテーブル削除
DROP TABLE IF EXISTS test_embeddings;
```

---

## 6. .env.local 設定

```bash
# プロジェクトルートで実行
cp .env.example .env.local

# 以下の変数を実際の値に変更
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
# DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
# DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

---

## 7. 接続テスト

```bash
# Prisma 接続テスト
cd packages/database
pnpm prisma db pull  # 既存スキーマ確認
```

---

## 参考リンク

- [Supabase pgvector ドキュメント](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Prisma + Supabase](https://supabase.com/docs/guides/database/prisma)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
