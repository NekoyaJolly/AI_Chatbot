'use client';

// apps/web/components/analytics/analytics-dashboard.tsx
// W4-005: Analytics ダッシュボードメインコンポーネント

import { StatsCard } from './stats-card';
import { ChatStatsChart } from './chat-stats-chart';
import { FaqPopularityChart } from './faq-popularity-chart';
import { ChannelBreakdownChart } from './channel-breakdown-chart';

interface OverviewStats {
  totalSessionsThisMonth: number;
  sessionGrowthRate: number;
  aiResolutionRate: number;
  avgResponseTimeMs: number;
  totalFaqs: number;
  activeUsersThisMonth: number;
}

interface ChatStats {
  dailyStats: Array<{
    date: string;
    totalSessions: number;
    aiResolvedSessions: number;
    escalatedSessions: number;
    aiResolutionRate: number;
    escalationRate: number;
    avgConfidence: number;
    avgDurationSecs: number;
  }>;
  totalSessions: number;
  aiResolutionRate: number;
  escalationRate: number;
  avgConfidence: number;
}

interface FaqPopularity {
  items: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string | null;
    viewCount: number;
    rank: number;
  }>;
  totalFaqs: number;
}

interface UserEngagement {
  activeUsers: number;
  newUsers: number;
  avgSessionsPerDay: number;
  avgSessionDurationSecs: number;
  channelBreakdown: Record<string, number>;
}

interface AnalyticsDashboardProps {
  overview: OverviewStats | null;
  chatStats: ChatStats | null;
  faqPopularity: FaqPopularity | null;
  engagement: UserEngagement | null;
}

// デモ用フォールバックデータ (API未接続時)
const DEMO_DAILY_STATS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000);
  const base = 20 + Math.floor(Math.random() * 30);
  const esc = Math.floor(base * 0.1);
  return {
    date: d.toISOString().split('T')[0],
    totalSessions: base,
    aiResolvedSessions: base - esc,
    escalatedSessions: esc,
    aiResolutionRate: Math.round(((base - esc) / base) * 100 * 10) / 10,
    escalationRate: Math.round((esc / base) * 100 * 10) / 10,
    avgConfidence: 0.78 + Math.random() * 0.15,
    avgDurationSecs: 60 + Math.floor(Math.random() * 60),
  };
});

const DEMO_FAQ = Array.from({ length: 8 }, (_, i) => ({
  id: `faq-${i}`,
  question: ['トリミングの料金は？', '予約方法は？', '営業時間は？', 'ペットホテルは？', 'ワクチンは必要？', '支払い方法は？', 'キャンセルは？', '駐車場は？'][i] ?? `FAQ${i}`,
  answer: '詳細はスタッフへお問い合わせください。',
  category: ['料金', '予約', '営業', 'サービス', '医療', '支払', '予約', '設備'][i] ?? null,
  viewCount: 200 - i * 20,
  rank: i + 1,
}));

export function AnalyticsDashboard({
  overview,
  chatStats,
  faqPopularity,
  engagement,
}: AnalyticsDashboardProps) {
  const ov = overview ?? {
    totalSessionsThisMonth: 320,
    sessionGrowthRate: 12.5,
    aiResolutionRate: 88.7,
    avgResponseTimeMs: 1240,
    totalFaqs: 48,
    activeUsersThisMonth: 134,
  };

  const dailyStats = chatStats?.dailyStats ?? DEMO_DAILY_STATS;
  const faqItems = faqPopularity?.items ?? DEMO_FAQ;
  const channelBreakdown = engagement?.channelBreakdown ?? { web: 60, line: 30, widget: 10 };

  const isDemo = !overview;

  return (
    <div className="space-y-6">
      {/* デモバナー */}
      {isDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          ⚠️ APIに接続できていません。デモデータを表示しています。
        </div>
      )}

      {/* 概要統計カード */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatsCard
          title="今月セッション"
          value={ov.totalSessionsThisMonth.toLocaleString()}
          trend={ov.sessionGrowthRate}
          subValue="先月比"
        />
        <StatsCard
          title="AI解決率"
          value={`${ov.aiResolutionRate}%`}
          subValue="全セッション中"
        />
        <StatsCard
          title="平均応答時間"
          value={`${(ov.avgResponseTimeMs / 1000).toFixed(1)}s`}
          subValue="目標 <2s"
        />
        <StatsCard
          title="登録FAQ"
          value={ov.totalFaqs.toLocaleString()}
          subValue="件"
        />
        <StatsCard
          title="アクティブユーザー"
          value={ov.activeUsersThisMonth.toLocaleString()}
          subValue="今月"
        />
        <StatsCard
          title="エスカレーション率"
          value={`${chatStats?.escalationRate ?? 11.3}%`}
          subValue="目標 <15%"
        />
      </div>

      {/* チャート行 1: 日次統計 */}
      <ChatStatsChart data={dailyStats} />

      {/* チャート行 2: FAQ + チャネル */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FaqPopularityChart data={faqItems} />
        <ChannelBreakdownChart channelBreakdown={channelBreakdown} />
      </div>

      {/* エンゲージメントサマリー */}
      {engagement && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatsCard
            title="アクティブユーザー"
            value={engagement.activeUsers}
            subValue="ユニーク"
          />
          <StatsCard
            title="新規ユーザー"
            value={engagement.newUsers}
            subValue="期間中"
          />
          <StatsCard
            title="1日平均セッション"
            value={engagement.avgSessionsPerDay}
            subValue="件/日"
          />
          <StatsCard
            title="平均セッション時間"
            value={`${engagement.avgSessionDurationSecs}s`}
            subValue="秒"
          />
        </div>
      )}
    </div>
  );
}
