---
id: ADR-003
title: Turborepo Monorepo Strategy
status: Accepted
date: 2026-02-18
tags: ["adr", "monorepo", "turborepo", "architecture"]
---

# ADR-003: Turborepo Monorepo Strategy

## Status

**Accepted** (2026-02-18)

---

## Context

プロジェクト構成として、**Monorepo**（単一リポジトリ）または **Multi-repo**（複数リポジトリ）を選択する必要があった。

### プロジェクト構成要件

| コンポーネント | 技術スタック |
|--------------|-------------|
| Frontend | Next.js 15 (Vercel) |
| Backend API | NestJS 11 (GCP Cloud Run) |
| LINE Bot | Express (GCP Cloud Run) |
| 共通型定義 | TypeScript |
| 共通UIコンポーネント | shadcn/ui |
| データベーススキーマ | Prisma |

### 検討した選択肢

1. **Monorepo** (Turborepo)
2. **Multi-repo** (個別リポジトリ)
3. **Monorepo** (Nx)
4. **Monorepo** (Lerna)

---

## Decision

**Turborepo によるモノレポ採用**

ディレクトリ構造:
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
└── turbo.json            # Turborepo設定
```

---

## Rationale

### 比較表

| 評価項目 | Turborepo (Monorepo) | Multi-repo | Nx | Lerna |
|---------|---------------------|-----------|-----|-------|
| **コード共有** | ✅ packages/ で簡単 | ❌ npm publish必要 | ✅ libs/ で簡単 | ✅ packages/ で簡単 |
| **依存管理** | ✅ pnpm workspace | ❌ 各リポジトリで個別 | ✅ npm/pnpm/yarn | ✅ npm/yarn |
| **ビルドキャッシュ** | ✅ Remote Cache (Vercel) | ❌ なし | ✅ Cloud Cache | ⚠️ 限定的 |
| **並列ビルド** | ✅ 自動並列化 | ❌ 手動制御 | ✅ 自動並列化 | ⚠️ 手動並列化 |
| **CI/CD** | ✅ シンプル | ❌ 複数パイプライン | ✅ シンプル | ⚠️ 複雑 |
| **型安全性** | ✅ TypeScript型が自動伝播 | ❌ 手動で型定義公開 | ✅ 自動伝播 | ✅ 自動伝播 |
| **学習曲線** | ✅ 低 | - | ⚠️ 高（Angular的） | ✅ 低 |
| **コミュニティ** | ✅ Vercel支援 | - | ✅ Nrwl支援 | ⚠️ 開発停滞 |

### 1. コード共有効率

**Monorepo (Turborepo)**:
```typescript
// packages/types/src/User.ts
export interface User {
  id: string;
  name: string;
}

// apps/api/src/users/users.service.ts
import { User } from '@repo/types'; // ✅ 自動補完動作

// apps/web/app/users/page.tsx
import { User } from '@repo/types'; // ✅ 同じ型定義を共有
```

**Multi-repo**:
```typescript
// types-package リポジトリで npm publish
// apps/api で npm install @company/types
// apps/web で npm install @company/types
// ❌ 型変更のたびに publish + install が必要
```

**結論**: MonorepoはTypeScript型が自動伝播し、開発効率が高い

### 2. 依存管理

**Monorepo (pnpm workspace)**:
```json
// package.json (root)
{
  "workspaces": ["apps/*", "packages/*"]
}
```
- ✅ 共通依存は1回インストール（node_modules共有）
- ✅ バージョン統一が容易（例: React 19を全アプリで統一）

**Multi-repo**:
- ❌ 各リポジトリで個別にnode_modulesをインストール
- ❌ バージョン不整合リスク（apps/webがReact 19、apps/apiがReact 18等）

**結論**: Monorepoは依存管理が統一的

### 3. ビルドキャッシュ

**Turborepo Remote Cache**:
```json
// turbo.json
{
  "remoteCache": {
    "signature": true
  }
}
```
- ✅ Vercel Remote Cache で CI/CD高速化（重複ビルドをスキップ）
- ✅ ローカル開発でもキャッシュ共有

**Multi-repo**:
- ❌ 各リポジトリで毎回フルビルド
- ❌ キャッシュ共有なし

**結論**: Turborepoのキャッシュで開発速度向上

### 4. CI/CD簡素化

**Monorepo (Turborepo)**:
```yaml
# .github/workflows/ci.yml
- name: Build
  run: pnpm turbo build --filter=...[$GITHUB_SHA]
```
- ✅ 変更のあった apps/ のみビルド（自動検出）
- ✅ 並列テスト実行（apps/web と apps/api を同時）

**Multi-repo**:
- ❌ 各リポジトリごとにGitHub Actions設定
- ❌ 並列実行は手動制御

**結論**: MonorepoはCI/CDがシンプル

---

## Consequences

### Positive（メリット）

- ✅ **コード共有効率**: `packages/types` で型定義を一元管理
- ✅ **統一的な依存管理**: pnpm workspace による効率的なnode_modules
- ✅ **CI/CD簡素化**: Turborepo Remote Cache で重複ビルド削減
- ✅ **開発者体験**: TypeScript型の自動補完が apps/ と packages/ 間で機能
- ✅ **リファクタリング容易**: 変更影響範囲が同一リポジトリ内で完結

### Negative（デメリット）

- ❌ **初期セットアップコスト**: Turborepo設定、pnpm workspace設定
- ❌ **ビルドキャッシュ管理**: Vercel Remote Cache設定が必要
- ❌ **リポジトリサイズ増加**: 全コンポーネントが1リポジトリに集約

### Mitigation（対策）

| デメリット | 対策 |
|-----------|------|
| 初期セットアップコスト | Turborepoテンプレート活用（`npx create-turbo@latest`） |
| ビルドキャッシュ管理 | Vercel無料プランでRemote Cache利用可能 |
| リポジトリサイズ増加 | `.gitignore` で node_modules, dist 除外 |

---

## Alternatives Considered

### 代替案1: Multi-repo

**理由**: 各コンポーネントが独立して開発・デプロイ可能

**却下理由**:
- ❌ コード共有が非効率（npm publish必要）
- ❌ 型定義の変更が複数リポジトリに波及 → 同期コスト増加
- ❌ CI/CDパイプラインを複数管理 → 運用コスト増加

### 代替案2: Nx (Monorepo)

**理由**: Nrwl社による強力なMonorepoツール

**却下理由**:
- ❌ 学習曲線が高い（Angular的な依存注入設定等）
- ❌ Turborepoより設定が複雑
- ✅ ただし、NxはエンタープライズGrade機能が豊富（今回は過剰）

### 代替案3: Lerna (Monorepo)

**理由**: 歴史的に実績あるMonorepoツール

**却下理由**:
- ❌ 開発が停滞気味（2019-2022年は更新なし）
- ❌ Turborepoより並列ビルドが遅い
- ❌ Remote Cache機能なし

---

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspace](https://pnpm.io/workspaces)
- [Vercel Remote Cache](https://turbo.build/repo/docs/core-concepts/remote-caching)

---

## Related Documents

| ドキュメント | 説明 |
|-------------|------|
| [`tech-decisions.md`](../context/tech-decisions.md) | 技術選定理由サマリー |
| [`/AGENTS.md`](/AGENTS.md) | Monorepo構造詳細 |

---

## 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2026-02-18 | ADR-003初版作成 | AI Agent |

---

> **このADRは最終決定を記録するものです。** 将来的にMonorepoツールを変更する場合は、新しいADRを作成してください（例: ADR-012: Migrate to Nx）。
