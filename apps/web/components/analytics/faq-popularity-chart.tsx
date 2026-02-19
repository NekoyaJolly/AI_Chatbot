'use client';

// apps/web/components/analytics/faq-popularity-chart.tsx
// W4-005: FAQ人気度棒グラフ (Recharts)

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

interface FaqItem {
  id: string;
  question: string;
  viewCount: number;
  rank: number;
  category?: string | null;
}

interface FaqPopularityChartProps {
  data: FaqItem[];
}

// 上位5を別色で強調
const COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
  '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8',
];

export function FaqPopularityChart({ data }: FaqPopularityChartProps) {
  // 質問を20文字に短縮
  const chartData = data.map((f) => ({
    ...f,
    shortQuestion:
      f.question.length > 18 ? f.question.substring(0, 18) + '…' : f.question,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-base font-semibold text-gray-800">FAQ 参照数ランキング</h3>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, bottom: 5, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis
            type="category"
            dataKey="shortQuestion"
            width={140}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value} 回`, '参照数']}
            labelFormatter={(label: string) => label}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="viewCount" name="参照数" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index] ?? '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
