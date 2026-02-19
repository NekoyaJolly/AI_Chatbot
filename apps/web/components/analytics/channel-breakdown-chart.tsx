'use client';

// apps/web/components/analytics/channel-breakdown-chart.tsx
// W4-005: チャネル別内訳 (PieChart)

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface ChannelBreakdownChartProps {
  channelBreakdown: Record<string, number>;
}

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Webチャット',
  line: 'LINE Bot',
  widget: '埋め込みウィジェット',
};

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function ChannelBreakdownChart({ channelBreakdown }: ChannelBreakdownChartProps) {
  const total = Object.values(channelBreakdown).reduce((a, b) => a + b, 0);

  const data = Object.entries(channelBreakdown).map(([key, value]) => ({
    name: CHANNEL_LABELS[key] ?? key,
    value,
    percent: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">チャネル別内訳</h3>

      {total === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400">
          データがありません
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} (${data.find(d => d.name === name)?.percent}%)`, name]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
