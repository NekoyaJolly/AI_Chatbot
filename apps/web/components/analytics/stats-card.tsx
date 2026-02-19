'use client';

// apps/web/components/analytics/stats-card.tsx
// W4-005: 統計カードコンポーネント

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trend?: number;       // 増減率 (%)
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({
  title,
  value,
  subValue,
  trend,
  icon,
  className = '',
}: StatsCardProps) {
  const trendColor =
    trend === undefined
      ? ''
      : trend >= 0
      ? 'text-emerald-600'
      : 'text-red-500';

  const trendIcon = trend === undefined ? '' : trend >= 0 ? '↑' : '↓';

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      <div className="mt-1 flex items-center gap-2">
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        {trend !== undefined && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trendIcon} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  );
}
