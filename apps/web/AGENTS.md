---
description: "Frontend (Next.js 15.5 / React 19) specific rules for AI developers. Focus on Server Actions, React 19 hooks, and Tailwind v4 performance."
tags: ["agents-v1.1", "frontend", "nextjs15", "react19", "tailwind-v4", "vercel"]
version: 1.1.1
jurisdiction: "apps/web"
inherits: "/AGENTS.md"
last_updated: 2026-02-19
---

# AGENTS.md - Frontend Rules (apps/web)

> **エージェントへの指示**: あなたはこのディレクトリ内のフロントエンド実装の「最高責任者」です。ルートの `AGENTS.md` を継承しつつ、Next.js 15 の非同期制約と React 19 の新機能を厳格に適用してください。
> **管轄範囲**: このファイルは `apps/web/` 配下の Next.js 15 Frontend にのみ適用されます。
> **親ルール**: ルートの `AGENTS.md` を継承し、矛盾する場合はこちらが優先されます。

---

## 🎨 Frontend Technology Stack (2026)

| Category            | Technology                                        |
| ------------------- | ------------------------------------------------- |
| **Framework**       | Next.js 15.5+ (App Router / Turbopack)            |
| **Library**         | React 19 (Server Components / Actions)            |
| **Styling**         | Tailwind CSS v4 (CSS-first engine)                |
| **UI Components**   | shadcn/ui (Tailwind v4 compatible)                |
| **Server State**    | TanStack Query v5 (React Query)                   |
| **Client State**    | Zustand (Store-per-feature, 最小限に保つ)          |
| **Forms**           | Server Actions + `useActionState` + Zod           |
| **Auth**            | Auth.js (NextAuth v5)                             |
| **HTTP Client**     | fetch API (Next.js 拡張版)                        |
| **Deployment**      | Vercel (Edge Runtime 対応)                        |

---

## 📁 Directory Structure Rules

### App Router 2026 Pattern

```text
apps/web/
├── app/                        # App Router
│   ├── (auth)/                 # 認証グループ (Route Group)
│   ├── (dashboard)/            # 業務管理画面グループ
│   │   ├── faqs/
│   │   │   ├── [id]/           # ⚠️ params は非同期として扱う (Next.js 15仕様)
│   │   │   └── page.tsx
│   ├── actions/                # Server Actions (全機能共通)
│   ├── api/                    # API Routes (Vercel Functions)
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Home Page
├── components/
│   ├── ui/                     # shadcn/ui components (⛔ 直接編集禁止)
│   ├── features/               # ドメインごとの疎結合コンポーネント
│   ├── shared/                 # プロジェクト共通部品
│   └── layouts/                # Layout components
├── lib/                        # ユーティリティ
│   ├── hooks/                  # Custom React Hooks
│   ├── stores/                 # Zustand stores (feature 単位)
│   ├── utils.ts                # 汎用ヘルパー
│   └── api-client.ts           # API クライアント
├── styles/                     # グローバル CSS (globals.css + @theme)
└── public/                     # 静的ファイル
```

---

## 🛠️ Development Rules (Next.js 15 / React 19 Optimized)

### 1. 非同期 API の厳格な取り扱い (Next.js 15 重要事項)

Next.js 15 では `params`, `searchParams`, `headers()`, `cookies()` 等が **非同期（Promise）** に変更されました。同期的なアクセスは実行時エラーの原因となります。

```typescript
// ❌ NG (Next.js 14 以前のパターン)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params; // 🚨 Runtime Error in Next.js 15
}

// ✅ OK (Next.js 15)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div>ID: {id}</div>;
}
```

```typescript
// ✅ headers / cookies も必ず await する
import { cookies, headers } from "next/headers";

export async function AdminPanel() {
  const cookieStore = await cookies();
  const headerList = await headers();
  // ...
}
```

### 2. fetch Caching の仕様変更

```typescript
// Next.js 15 ではデフォルトが `no-store` に変更
// 明示的にキャッシュする場合のみ指定
const data = await fetch("https://api.example.com/data", {
  cache: "force-cache", // 明示的にキャッシュ
  next: { revalidate: 3600 }, // ISR: 1時間ごとに再検証
});
```

### 3. Form Handling: Server Actions 優先

React 19 の `useActionState` を使用し、Server Actions によるプログレッシブ・エンハンスメントを実装してください。

**原則**: クライアントサイドのみの `onSubmit` よりも、**Server Actions を優先**。
**バリデーション**: **Zod** を使用し、サーバーとクライアントの両方で検証。

```typescript
// app/actions/create-post.ts
"use server";

import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  body: z.string().min(10, "本文は10文字以上で入力してください"),
});

export async function createPost(prevState: any, formData: FormData) {
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // DB操作...
  return { success: true };
}
```

```tsx
// components/features/post-form.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createPost } from "@/app/actions/create-post";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? "送信中..." : "投稿する"}
    </button>
  );
}

export function PostForm() {
  const [state, formAction] = useActionState(createPost, { errors: {} });

  return (
    <form action={formAction}>
      <input name="title" />
      {state.errors?.title && <p className="text-red-500">{state.errors.title}</p>}
      <textarea name="body" />
      {state.errors?.body && <p className="text-red-500">{state.errors.body}</p>}
      <SubmitButton />
    </form>
  );
}
```

### 4. React 19 新フック活用ガイド

| Hook | 用途 | 注意事項 |
| --- | --- | --- |
| `useActionState` | Server Actions のフォーム状態管理 | `useFormState` は非推奨、必ずこちらを使用 |
| `useFormStatus` | フォーム送信状態 (`pending`) の取得 | `<form>` の**子コンポーネント内**でのみ動作 |
| `useOptimistic` | 楽観的 UI 更新 | サーバー応答前に UI を即座に反映する |
| `use()` | Promise / Context の直接読み取り | Server Components でのデータフェッチに最適 |

```tsx
// useOptimistic の実践例
"use client";
import { useOptimistic } from "react";

export function CommentList({ comments, addCommentAction }) {
  const [optimisticComments, addOptimistic] = useOptimistic(
    comments,
    (state, newComment) => [...state, { ...newComment, pending: true }]
  );

  async function handleSubmit(formData: FormData) {
    const newComment = { text: formData.get("text"), pending: true };
    addOptimistic(newComment);
    await addCommentAction(formData);
  }

  return (
    <>
      {optimisticComments.map((c, i) => (
        <div key={i} className={c.pending ? "opacity-50" : ""}>
          {c.text}
        </div>
      ))}
      <form action={handleSubmit}>
        <input name="text" />
        <button type="submit">コメント</button>
      </form>
    </>
  );
}
```

### 5. Server vs Client Components の使い分け

| 判断基準 | Server Component (Default) | Client Component (`"use client"`) |
| --- | --- | --- |
| データフェッチ | ✅ 推奨 | ❌ |
| SEO 関連メタデータ | ✅ | ❌ |
| 秘密情報 (API Key 等) | ✅ 安全 | 🚨 漏洩リスク |
| `useState` / `useEffect` | ❌ 使用不可 | ✅ 必須 |
| ブラウザ API (`window`, `localStorage`) | ❌ | ✅ |
| `onClick` 等のイベントハンドラ | ❌ | ✅ |
| shadcn/ui の動的パーツ | — | ✅ |

**原則**: `"use client"` は**本当に必要な場合のみ**使用。デフォルトは全て Server Component。

### 6. Hydration Mismatch の完全回避

React 19 では Hydration エラーのレポートが強化されています。

```tsx
// ❌ NG - サーバーとクライアントで出力が変わる
export default function Page() {
  return <p>Now: {Date.now()}</p>; // 🚨 Hydration Mismatch
}

// ✅ OK - クライアントでのみレンダリング
"use client";
import { useState, useEffect } from "react";

export function CurrentTime() {
  const [time, setTime] = useState<string>("");
  useEffect(() => {
    setTime(new Date().toLocaleTimeString());
  }, []);
  return <p>Now: {time}</p>;
}
```

### 7. after() によるレスポンス後処理 (Next.js 15)

重いロギングや分析送信は `after()` 関数を使用して、レスポンス送信後に非同期実行する。

```typescript
import { after } from "next/server";
import { log } from "@/lib/logger";

export async function POST(request: Request) {
  const data = await request.json();
  // メイン処理...

  // レスポンス送信後にバックグラウンドで実行
  after(async () => {
    await log({ action: "post_created", data });
    // 分析、通知、キャッシュ無効化 etc.
  });

  return Response.json({ success: true });
}
```

> **注意**: `after()` 内で `cookies()` / `headers()` が使えるのは Server Actions と Route Handlers のみ。Server Components 内では使用不可。

---

## 🎨 Tailwind CSS v4 & Styling

### CSS-first Configuration

```css
/* styles/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #0066ff;
  --color-secondary: #ff6a00;
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --font-sans: "Inter", sans-serif;
  --breakpoint-xs: 475px;
}
```

- **CSS-first**: 設定は `globals.css` の `@theme` ブロックで行い、`tailwind.config.js` は**原則使用しません**。
- **`@apply` は最小限**: ユーティリティクラスの直接使用を優先し、`@apply` は繰り返しパターン (ボタン等) のみ。
- **CSS Layers**: `@layer base`, `@layer components`, `@layer utilities` で整理。

### Class Naming Order (必須)

クラスの記述順序を統一して可読性を保つ:

```
Layout → Display → Position → Spacing → Sizing → Typography → Decoration → State
```

```tsx
// ✅ 順序を守った記述
<div className="flex items-center relative mx-4 px-6 py-3 w-full h-12 text-sm font-bold bg-primary rounded-lg shadow-md hover:bg-secondary" />
```

### Dark Mode

```tsx
// dark: 修飾子を使用し、システム設定に追従
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  {/* ... */}
</div>
```

---

## 🔒 Security

- **環境変数**: `NEXT_PUBLIC_` プレフィックスのみクライアントに公開される。それ以外はサーバー専用。
- **API Routes**: 認証ミドルウェア必須。
- **Server Actions**: Next.js 15 は不使用の Action エンドポイントを自動削除し、推測困難な ID を付与。
- **XSS 対策**: React のデフォルトエスケープに依存、`dangerouslySetInnerHTML` は**禁止**。
- **CSRF 対策**: Same-Site Cookie + CSRF Token。
- **秘密情報**: Server Components / Server Actions 内でのみ扱う。Client Components に絶対に渡さない。

---

## 🧪 Testing Strategy

| レイヤー | ツール | 対象 |
| --- | --- | --- |
| **Unit Test** | Vitest (Jest 互換, 高速) | ユーティリティ関数、ロジック |
| **Component Test** | React Testing Library | UI コンポーネント |
| **E2E Test** | Playwright | ユーザーフロー全体 |
| **Visual Regression** | Chromatic (Storybook 連携) | デザイン崩れ検知 |

### テスト時の注意事項

- **Hydration Sync**: TanStack Query の `HydrationBoundary` を活用し、サーバーでフェッチしたデータをクライアントにスムーズに引き継ぐ。

```tsx
// ✅ HydrationBoundary パターン
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";

export default async function Page() {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}
```

---

## ⚡ Performance Optimization

- **Image Optimization**: `next/image` の `priority` 属性を LCP（最大視覚コンテンツ）に必ず指定。
- **Font Optimization**: `next/font` で Google Fonts 等を読み込み、レイアウトシフトを防止。
- **Code Splitting**: Dynamic Imports (`next/dynamic`) を活用し、初期バンドルを最小化。
- **Bundle Size**: `@next/bundle-analyzer` で定期的に確認。
- **Suspense + Streaming**: `loading.tsx` と `<Suspense>` で段階的レンダリング。
- **Error Boundaries**: `error.tsx` でルートレベルのエラーバウンダリを実装。
- **After Task**: 重い処理は `after()` でレスポンス後に実行。

---

## 📞 Human Contact Protocol (Frontend 固有)

以下の場合は**実装前に人間に確認**してください:

- 新しい npm パッケージの追加 (bundle size への影響)
- Vercel の有料機能の使用 (Edge Middleware, ISR 等)
- デザインシステムの大幅な変更 (Tailwind 設定、shadcn/ui カスタマイズ)
- SEO 戦略に影響する変更 (metadata, sitemap, robots.txt)
- 認証フロー / セキュリティに関わる変更
- 外部 API 連携の新規追加

---

## 🚨 Common Pitfalls (AI エージェントが陥りやすい罠)

| ❌ やってはいけないこと | ✅ 正しいアプローチ |
| --- | --- |
| Next.js 15 なのに `params.id` に直接アクセスする | `await params` してから使用する |
| `headers()` / `cookies()` を `await` せずに使う | 必ず `await` してから値を取得 |
| React 19 なのに `useTransition` + 手動 `isLoading` 管理 | `useActionState` + `useFormStatus` を使用 |
| `useFormState` (非推奨) を使い続ける | `useActionState` に移行する |
| インラインスタイルを多用する | Tailwind クラスで完結させる |
| `tailwind.config.js` で設定を書く | `globals.css` の `@theme` ブロックを使用 |
| Client Component にサーバー秘密情報を渡す | Server Components 内でのみ扱う |
| `dangerouslySetInnerHTML` を使用する | React のデフォルトエスケープに従う |
| `"use client"` を不必要につける | Server Component がデフォルト、必要時のみ付与 |
| shadcn/ui の `ui/` フォルダを直接編集する | カスタムは `features/` または `shared/` で wrap |

---

## ✅ Task Completion Checklist

タスク完了時、AIエージェントは以下を必ず確認してから報告すること:

- [ ] **Hydration エラーの有無**: サーバー/クライアント間の出力不一致がないか
- [ ] **Next.js 15 非同期 API 準拠**: `params`, `searchParams`, `headers()`, `cookies()` を全て `await` しているか
- [ ] **React 19 フック使用**: `useActionState`, `useFormStatus`, `useOptimistic` を適切に使用しているか
- [ ] **Tailwind v4 準拠**: `@theme` ベースの設定、クラス順序が正しいか
- [ ] **型安全性**: TypeScript の型エラーがないか
- [ ] **セキュリティ**: 秘密情報がクライアントに漏洩していないか
- [ ] **アクセシビリティ**: ARIA 属性、キーボード操作が適切か

---

**このファイルはフロントエンド開発者（AI / 人間）のための「生きた憲法」です。技術スタックやベストプラクティスの更新に合わせて継続的に改訂してください。**
