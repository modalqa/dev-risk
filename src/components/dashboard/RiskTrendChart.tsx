'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendPoint } from '@/types';

interface RiskTrendChartProps {
  data: TrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2.5 shadow-xl">
        <p className="text-xs text-gray-400 mb-1.5">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-400">{p.name}:</span>
            <span className="text-white font-medium">{p.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function RiskTrendChart({ data }: RiskTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
          iconType="circle"
          iconSize={6}
        />
        <Area
          type="monotone"
          dataKey="riskIndex"
          name="Risk Index"
          stroke="#ef4444"
          strokeWidth={2}
          fill="url(#riskGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#ef4444' }}
        />
        <Area
          type="monotone"
          dataKey="engineeringScore"
          name="Eng. Score %"
          stroke="#7c3aed"
          strokeWidth={2}
          fill="url(#engGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#7c3aed' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
