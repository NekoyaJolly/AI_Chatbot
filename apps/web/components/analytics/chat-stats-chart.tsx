'use client';

// apps/web/components/analytics/chat-stats-chart.tsx
// W4-005: 日次チャット統計グラフ (Recharts)

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DailyStat {
  date: string;
  totalSessions: number;
  aiResolvedSessions: number;
  escalatedSessions: number;
  aiResolutionRate: number;
  escalationRate: number;
  avgConfidence: number;
  avgDurationSecs: number;
}

interface ChatStatsChartProps {
  data: DailyStat[];
}

// カスタムツールチップ
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <p className="mb-2 font-semibold text-gray-700">{label}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }} className="text-xs">
          {item.name}: {item.name.includes('率') ? `${item.value}%` : item.value}
        </p>
      ))}
    </div>
  );
}

export function ChatStatsChart({ data }: ChatStatsChartProps) {
  // 日付を短縮表示 (MM/DD)
  const chartData = data.map((d) => ({
    ...d,
    dateLabel: d.date.slice(5), // "YYYY-MM-DD" → "MM-DD"
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">日次チャット統計</h3>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {/* セッション数 (棒グラフ) */}
          <Bar
            yAxisId="left"
            dataKey="totalSessions"
            name="総セッション"
            fill="#6366f1"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />
          <Bar
            yAxisId="left"
            dataKey="escalatedSessions"
            name="エスカレーション"
            fill="#f87171"
            radius={[3, 3, 0, 0]}
            maxBarSize={32}
          />

          {/* AI解決率 (折れ線グラフ) */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="aiResolutionRate"
            name="AI解決率"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
