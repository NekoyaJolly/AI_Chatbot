// apps/web/app/(dashboard)/analytics/page.tsx
// W4-005: Analytics ダッシュボードページ

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';

export const metadata = { title: 'Analytics - AI Chatbot' };

// サーバーサイドでデータを取得
async function fetchAnalyticsData(token: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // 30日前
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();

  try {
    const [overviewRes, chatStatsRes, faqRes, engagementRes] = await Promise.all([
      fetch(`${apiBase}/api/v1/analytics/overview`, { headers, next: { revalidate: 300 } }),
      fetch(`${apiBase}/api/v1/analytics/chat-stats?from=${from}&to=${to}`, { headers, next: { revalidate: 300 } }),
      fetch(`${apiBase}/api/v1/analytics/faq-popularity?limit=10`, { headers, next: { revalidate: 300 } }),
      fetch(`${apiBase}/api/v1/analytics/user-engagement?from=${from}&to=${to}`, { headers, next: { revalidate: 300 } }),
    ]);

    const [overview, chatStats, faqPopularity, engagement] = await Promise.all([
      overviewRes.ok ? overviewRes.json() : null,
      chatStatsRes.ok ? chatStatsRes.json() : null,
      faqRes.ok ? faqRes.json() : null,
      engagementRes.ok ? engagementRes.json() : null,
    ]);

    return { overview, chatStats, faqPopularity, engagement };
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return { overview: null, chatStats: null, faqPopularity: null, engagement: null };
  }
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // JWT トークンを取得 (NextAuth v5 session.accessToken)
  const token = (session as unknown as { accessToken?: string }).accessToken ?? '';
  const data = await fetchAnalyticsData(token);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-gray-500">チャットボット稼働状況・FAQ利用分析</p>
      </div>

      <AnalyticsDashboard
        overview={data.overview}
        chatStats={data.chatStats}
        faqPopularity={data.faqPopularity}
        engagement={data.engagement}
      />
    </div>
  );
}
