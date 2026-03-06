import { cn } from '@/lib/utils';

interface RiskIndexGaugeProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RiskIndexGauge({ value, label = 'Risk Index', size = 'md' }: RiskIndexGaugeProps) {
  const clamp = Math.min(100, Math.max(0, value));
  const angle = (clamp / 100) * 180 - 90; // -90 to 90 deg

  const color =
    clamp >= 75 ? '#dc2626' :
    clamp >= 50 ? '#ef4444' :
    clamp >= 25 ? '#f59e0b' : '#10b981';

  const sizeMap = {
    sm: { outer: 80,  inner: 56, stroke: 10, fontSize: 18 },
    md: { outer: 120, inner: 88, stroke: 14, fontSize: 28 },
    lg: { outer: 160, inner: 120, stroke: 18, fontSize: 36 },
  };

  const { outer, inner, stroke, fontSize } = sizeMap[size];
  const r = (inner + outer) / 4 + stroke / 2;
  const circumference = Math.PI * r;
  const dashOffset = circumference - (clamp / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: outer, height: outer / 2 + 10 }}>
        <svg
          width={outer}
          height={outer / 2 + 10}
          viewBox={`0 0 ${outer} ${outer / 2 + 10}`}
        >
          {/* Background arc */}
          <path
            d={`M ${stroke / 2} ${outer / 2} A ${outer / 2 - stroke / 2} ${outer / 2 - stroke / 2} 0 0 1 ${outer - stroke / 2} ${outer / 2}`}
            fill="none"
            stroke="#1e2a3a"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d={`M ${stroke / 2} ${outer / 2} A ${outer / 2 - stroke / 2} ${outer / 2 - stroke / 2} 0 0 1 ${outer - stroke / 2} ${outer / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={circumference - (clamp / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s' }}
          />
          {/* Center value */}
          <text
            x={outer / 2}
            y={outer / 2 + 2}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="700"
            fill={color}
          >
            {clamp.toFixed(0)}
          </text>
          <text
            x={outer / 2}
            y={outer / 2 + 16}
            textAnchor="middle"
            fontSize="9"
            fill="#6b7280"
          >
            /100
          </text>
        </svg>
      </div>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
    </div>
  );
}
