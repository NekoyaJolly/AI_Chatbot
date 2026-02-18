// apps/web/app/(dashboard)/layout.tsx
// ダッシュボード共通レイアウト (サイドバー + ヘッダー)

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background">
      {/* サイドバー */}
      <Sidebar />

      {/* メインコンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
