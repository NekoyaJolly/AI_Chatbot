---
description: "Next.js 15 Frontend - Vercelデプロイ向けフロントエンド固有ルール"
tags: ["agents-v1.1", "frontend", "nextjs15", "react19", "tailwindcss", "vercel"]
version: 1.0.0
jurisdiction: "apps/web"
parent: "../../AGENTS.md"
last_updated: 2026-02-19
---

# AGENTS.md - Frontend (apps/web)

> **管轄範囲**: このファイルは `apps/web/` 配下のNext.js 15 Frontendにのみ適用されます。
> **親ルール**: ルートの `AGENTS.md` を継承し、矛盾する場合はこちらが優先されます。

---

## 🎨 Frontend固有の技術スタック

- **Framework**: Next.js 15 (App Router + Async Request APIs)
- **UI Library**: React 19 + shadcn/ui (Tailwind CSS v4)
- **State Management**: React Server Components + Zustand (最小限のクライアントstate)
- **Form**: React Hook Form + Zod validation
- **HTTP Client**: fetch API (Next.js拡張版)
- **Deployment**: Vercel (Edge Runtime 対応)

---

## 🛠️ Frontend開発ルール

### Next.js 15 固有の注意事項

1. **Async Request APIs (BREAKING CHANGE)**
   - `params`, `searchParams` は全て非同期になりました
   - 必ず `await` してから使用してください
   ```typescript
   // ❌ NG (Next.js 14)
   export default function Page({ params }) {
     const { id } = params;
   }
   
   // ✅ OK (Next.js 15)
   export default async function Page({ params }) {
     const { id } = await params;
   }
   ```

2. **Server Components First**
   - デフォルトは全てServer Component
   - `'use client'` は本当に必要な場合のみ使用
   - インタラクティブなUI (onClick, useState等) のみClient Component化

3. **fetch Caching**
   - Next.js 15では `fetch` のデフォルトキャッシュが `no-store` に変更
   - 明示的にキャッシュする場合は `{ cache: 'force-cache' }` を指定

### UI/UXルール

- **レスポンシブ**: Mobile-First設計、Tailwind Breakpoints準拠
- **アクセシビリティ**: ARIA属性必須、shadcn/uiのコンポーネントを活用
- **ローディング状態**: Suspense + loading.tsx を使用
- **エラーハンドリング**: error.tsx でエラーバウンダリを実装

### パフォーマンス最適化

- **Image最適化**: `next/image` 必須、width/height指定
- **Font最適化**: `next/font` でGoogle Fonts等を読み込み
- **Code Splitting**: Dynamic Imports (`next/dynamic`) を活用
- **Bundle Size**: `@next/bundle-analyzer` で定期的に確認

---

## 📁 ディレクトリ構造規約

```
apps/web/
├── app/                    # App Router
│   ├── (auth)/            # Route Groups
│   ├── (dashboard)/
│   ├── api/               # API Routes (Vercel Functions)
│   ├── layout.tsx         # Root Layout
│   └── page.tsx           # Home Page
├── components/            # React Components
│   ├── ui/                # shadcn/ui components
│   ├── features/          # Feature-specific components
│   └── layouts/           # Layout components
├── lib/                   # ユーティリティ
│   ├── utils.ts           # 汎用ヘルパー
│   └── api-client.ts      # APIクライアント
├── hooks/                 # Custom React Hooks
├── styles/                # グローバルCSS
└── public/                # 静的ファイル
```

---

## 🔒 セキュリティ

- **環境変数**: `NEXT_PUBLIC_` プレフィックスのみクライアントに公開される
- **API Routes**: 認証ミドルウェア必須
- **XSS対策**: Reactのデフォルトエスケープに依存、`dangerouslySetInnerHTML` は禁止
- **CSRF対策**: Same-Site Cookie + CSRF Token

---

## 🧪 テスト戦略

- **Unit Test**: Vitest (Jest互換、高速)
- **Component Test**: React Testing Library
- **E2E Test**: Playwright (Vercel環境で実行)
- **Visual Regression**: Chromatic (Storybook連携)

---

## 📞 Human Contact Protocol (Frontend固有)

以下の場合は実装前に人間に確認してください:
- 新しいnpmパッケージの追加 (bundle sizeへの影響)
- Vercelの有料機能の使用 (Edge Middleware, ISR等)
- デザインシステムの大幅な変更 (Tailwind設定、shadcn/uiカスタマイズ)
- SEO戦略に影響する変更 (metadata, sitemap, robots.txt)

---

**このファイルはフロントエンド開発者（AI/人間）のための「生きた憲法」です。**
