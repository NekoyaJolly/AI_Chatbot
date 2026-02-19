'use client';

// apps/web/components/dashboard/sidebar.tsx
// サイドバーナビゲーション

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '📊' },
  { href: '/dashboard/faqs', label: 'FAQ管理', icon: '❓' },
  { href: '/dashboard/chat', label: 'チャットプレビュー', icon: '💬' },
  { href: '/dashboard/analytics', label: 'アナリティクス', icon: '📈' },
  { href: '/dashboard/embed', label: '埋め込みコード', icon: '🔌' },
  { href: '/dashboard/settings', label: '設定', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      {/* ロゴ */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          🤖 <span>AI Chatbot SaaS</span>
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* バージョン */}
      <div className="border-t p-4 text-xs text-muted-foreground">v0.1.0</div>
    </aside>
  );
}
