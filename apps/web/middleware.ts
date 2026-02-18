// apps/web/middleware.ts
// NextAuth.js v5 - 認証ミドルウェア (保護ルート設定)

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

// 認証が必要なパス
const PROTECTED_PATHS = ['/dashboard', '/faqs', '/settings', '/analytics'];
// 未認証時のみアクセス可能なパス
const AUTH_PATHS = ['/login', '/signup'];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isProtected = PROTECTED_PATHS.some((path) => nextUrl.pathname.startsWith(path));
  const isAuthPath = AUTH_PATHS.some((path) => nextUrl.pathname.startsWith(path));

  // 未認証で保護ルートにアクセス → ログインへリダイレクト
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 認証済みでログイン/サインアップページにアクセス → ダッシュボードへリダイレクト
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
