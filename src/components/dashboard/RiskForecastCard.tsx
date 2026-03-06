'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';

interface RiskForecast {
  date: string;
  predictedRiskIndex: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  riskLevel: string;
  probability: number;
}

interface PredictionResult {
  currentRiskIndex: number;
  currentTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  trendStrength: number;
  forecasts: RiskForecast[];
  insights: string[];
  recommendations: string[];
  stabilityDecayCurve: { week: number; predictedScore: number }[];
  confidenceScore: number;
  fromCache?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-3 border border-border rounded-lg px-3 py-2.5 shadow-xl">
        <p className="text-xs text-gray-400 mb-1.5">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-400">Predicted Risk:</span>
            <span className="text-sm font-bold text-white">{data.predictedRiskIndex?.toFixed(1)}</span>
          </div>
          {data.lower !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400">95% CI:</span>
              <span className="text-xs text-gray-300">{data.lower?.toFixed(1)} - {data.upper?.toFixed(1)}</span>
            </div>
          )}
          {data.probability !== undefined && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400">High Risk Prob:</span>
              <span className="text-xs text-amber-400">{Math.round(data.probability * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function RiskForecastCard() {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrediction();
  }, []);

  async function fetchPrediction(useCache = true) {
    try {
      const res = await fetch(`/api/predictions?weeks=4&cache=${useCache}`);
      const data = await res.json();
      setPrediction(data);
    } catch (err) {
      console.error('Failed to fetch prediction:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchPrediction(false);
  }

  function getTrendIcon(trend: string) {
    switch (trend) {
      case 'WORSENING':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'IMPROVING':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  }

  function getTrendBadge(trend: string) {
    switch (trend) {
      case 'WORSENING':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30" size="sm">Worsening</Badge>;
      case 'IMPROVING':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30" size="sm">Improving</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30" size="sm">Stable</Badge>;
    }
  }

  function getRiskLevelColor(level: string) {
    switch (level) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      default: return '#10b981';
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-surface-2 rounded w-1/3 mb-4" />
        <div className="h-48 bg-surface-2 rounded" />
      </Card>
    );
  }

  if (!prediction || prediction.forecasts.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Risk Forecast</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500/50 mb-2" />
          <p className="text-sm text-gray-400">Insufficient data for forecasting</p>
          <p className="text-xs text-gray-500 mt-1">Need at least 3 weeks of historical data</p>
        </div>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = prediction.forecasts.map(f => ({
    date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    predictedRiskIndex: f.predictedRiskIndex,
    lower: f.confidenceInterval.lower,
    upper: f.confidenceInterval.upper,
    probability: f.probability,
    riskLevel: f.riskLevel,
  }));

  // Find weeks with high risk
  const highRiskWeeks = prediction.forecasts.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL');

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Risk Forecast (4 Weeks)</h3>
          {prediction.fromCache && (
            <span className="text-[10px] text-gray-500 px-1.5 py-0.5 bg-surface-2 rounded">cached</span>
          )}
        </div>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-surface-2 border border-border/50">
          <p className="text-xs text-gray-500 mb-1">Current Risk</p>
          <p className="text-xl font-bold text-white">{prediction.currentRiskIndex}</p>
        </div>
        <div className="p-3 rounded-lg bg-surface-2 border border-border/50">
          <p className="text-xs text-gray-500 mb-1">Trend</p>
          <div className="flex items-center gap-1.5">
            {getTrendIcon(prediction.currentTrend)}
            {getTrendBadge(prediction.currentTrend)}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-surface-2 border border-border/50">
          <p className="text-xs text-gray-500 mb-1">Confidence</p>
          <p className="text-xl font-bold text-white">{Math.round(prediction.confidenceScore * 100)}%</p>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
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
            
            {/* High risk threshold line */}
            <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" strokeOpacity={0.5} />
            
            {/* Confidence interval area */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="transparent"
              fill="url(#confidenceGrad)"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="transparent"
              fill="#0f172a"
            />
            
            {/* Prediction line */}
            <Line
              type="monotone"
              dataKey="predictedRiskIndex"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6, fill: '#6366f1' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* High Risk Alert */}
      {highRiskWeeks.length > 0 && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-red-400">High Risk Predicted</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Risk may exceed threshold around {new Date(highRiskWeeks[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                {' '}({Math.round(highRiskWeeks[0].probability * 100)}% probability)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      {prediction.insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Insights
          </p>
          <ul className="space-y-1.5">
            {prediction.insights.slice(0, 2).map((insight, i) => (
              <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
