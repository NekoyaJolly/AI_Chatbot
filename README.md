# AI Chatbot SaaS Platform

中小企業向け完全マネージド型AIチャットボットSaaSプラットフォーム

## 技術スタック

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 + React 19 + Tailwind CSS v4 + shadcn/ui |
| Backend | NestJS 11 + Gemini API + Langchain.js |
| Database | PostgreSQL 16 (Supabase) + pgvector |
| Cache | Redis 7 |
| Infrastructure | GCP Cloud Run + Vercel + Terraform |

## モノレポ構造

```
AI_Chatbot/
├── apps/
│   ├── web/              # Next.js 15 Frontend
│   ├── api/              # NestJS 11 Backend
│   └── line-bot/         # LINE Bot Server
├── packages/
│   ├── ui/               # shadcn/ui 共通コンポーネント
│   ├── database/         # Prisma schema + migrations
│   ├── types/            # TypeScript 共通型定義
│   └── langchain/        # AI/プロンプト共通ライブラリ
├── memory-bank/          # AI長期記憶
├── terraform/            # GCP インフラ定義
└── docs/                 # ドキュメント
```

## セットアップ

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動 (全アプリ)
pnpm dev

# ビルド
pnpm build

# テスト
pnpm test
```

## 環境変数

```bash
cp .env.example .env.local
# 必要な環境変数を設定してください
```

## ドキュメント

- [技術スタック詳細](docs/TECH_STACK.md)
- [API仕様書](docs/API_SPEC.md)
- [DB設計書](docs/DATABASE_SCHEMA.md)
- [Supabaseセットアップ](docs/SUPABASE_SETUP.md)
