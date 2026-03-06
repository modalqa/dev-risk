import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;   // positive = up, negative = down
  icon?: ReactNode;
  valueClassName?: string;
  className?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  valueClassName,
  className,
}: StatsCardProps) {
  const trendIcon =
    trend === undefined ? null :
    trend > 0 ? <TrendingUp className="w-3 h-3" /> :
    trend < 0 ? <TrendingDown className="w-3 h-3" /> :
    <Minus className="w-3 h-3" />;

  const trendClass =
    trend === undefined ? '' :
    trend > 0 ? 'text-red-400' :   // Risk up = bad
    trend < 0 ? 'text-emerald-400' : // Risk down = good
    'text-gray-400';

  return (
    <div className={cn('bg-surface rounded-xl border border-border p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{title}</p>
        {icon && <div className="text-gray-600">{icon}</div>}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <p className={cn('text-2xl font-bold text-white', valueClassName)}>{value}</p>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium mb-0.5', trendClass)}>
            {trendIcon}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
