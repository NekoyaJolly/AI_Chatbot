# Project Structure Initialization

**Date**: 2026-02-19  
**Status**: ✅ Completed

## Created Directory Structure

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
│   ├── decisions/        # 技術的意思決定ログ
│   └── progress/         # 進捗スナップショット
├── terraform/            # GCP インフラ定義
├── docs/                 # ドキュメント
├── AGENTS.md             # 📘 ルート共通ルール
├── BACKLOG.md            # 📋 タスクバックログ
└── BRD_PRD.md            # 📄 要件定義書
```

## Key Changes

1. **Monorepo Structure**: Created a monorepo structure following modern best practices with `apps/` and `packages/` separation
2. **AGENTS.md Hierarchy**: Established a three-tier AGENTS.md hierarchy:
   - Root: `/AGENTS.md` (common rules for entire project)
   - Frontend: `/apps/web/AGENTS.md` (Next.js 15 specific rules)
   - Backend: `/apps/api/AGENTS.md` (NestJS 11 specific rules)
3. **Memory Bank**: Created `memory-bank/` structure for AI context persistence
4. **Bug Fix**: Renamed `BACKROG,md` to `BACKLOG.md` (typo correction)

## AGENTS.md Files

### apps/web/AGENTS.md
- Next.js 15 Async Request APIs guidelines
- Server Components best practices
- Vercel deployment optimizations
- Frontend-specific security and performance rules

### apps/api/AGENTS.md
- NestJS 11 IntrinsicException usage
- Multi-tenant database design with RLS
- Gemini API and Langchain.js integration
- GCP Cloud Run deployment guidelines

## Next Steps

The directory structure is now ready for:
1. Package initialization (package.json, tsconfig.json)
2. Dependency installation
3. Application scaffolding
4. Infrastructure-as-Code setup (Terraform)
