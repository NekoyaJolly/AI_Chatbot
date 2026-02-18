// apps/web/app/(dashboard)/page.tsx
// W2-012: ダッシュボードホーム画面

import { StatsCard } from '@/components/dashboard/stats-card';

// モックデータ (Week 3でリアルAPIに置き換え)
const mockStats = {
  todayChats: 42,
  totalFaqs: 128,
  accuracyRate: 94,
  avgResponseTime: 1.2,
};

const mockActivity = [
  { id: 1, type: 'chat', message: '新しいチャットセッション開始', time: '5分前' },
  { id: 2, type: 'faq', message: 'FAQ「営業時間について」が作成されました', time: '1時間前' },
  { id: 3, type: 'chat', message: 'エスカレーション: 複雑な質問', time: '2時間前' },
  { id: 4, type: 'faq', message: 'FAQ「料金について」が更新されました', time: '3時間前' },
  { id: 5, type: 'chat', message: '10件の新しいチャット', time: '昨日' },
];

export default async function DashboardPage() {
  const stats = mockStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">AIチャットボットの稼働状況</p>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="今日のチャット"
          value={stats.todayChats}
          trend="+12%"
          icon="💬"
        />
        <StatsCard
          title="FAQ数"
          value={stats.totalFaqs}
          icon="❓"
          description="登録済みFAQ総数"
        />
        <StatsCard
          title="正答率"
          value={`${stats.accuracyRate}%`}
          icon="✅"
          trend="+2%"
        />
        <StatsCard
          title="平均応答時間"
          value={`${stats.avgResponseTime}s`}
          icon="⚡"
          description="AI応答速度"
        />
      </div>

      {/* 最近のアクティビティ */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">最近のアクティビティ</h2>
        <div className="space-y-3">
          {mockActivity.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">
                {activity.type === 'chat' ? '💬' : '📝'}
              </span>
              <span className="flex-1">{activity.message}</span>
              <span className="text-muted-foreground text-xs">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
