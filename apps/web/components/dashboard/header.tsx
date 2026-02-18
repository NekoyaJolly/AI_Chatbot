'use client';

// apps/web/components/dashboard/header.tsx
// ダッシュボードヘッダー

import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    tenantName?: string;
  };
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="text-sm text-muted-foreground">
        {user.tenantName && <span>🏢 {user.tenantName}</span>}
      </div>

      <div className="flex items-center gap-4">
        {/* ユーザー情報 */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* ログアウト */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          ログアウト
        </Button>
      </div>
    </header>
  );
}
