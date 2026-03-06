'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface Correlation {
  id: string;
  signalA: string;
  signalB: string;
  signalALabel: string;
  signalBLabel: string;
  correlation: number;
  strength: string;
  sampleSize: number;
  insight: string | null;
  calculatedAt: string;
}

export default function CorrelationInsights() {
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    fetchCorrelations();
  }, []);

  async function fetchCorrelations() {
    try {
      const res = await fetch('/api/correlations');
      const data = await res.json();
      setCorrelations(data.data || []);
    } catch (error) {
      console.error('Failed to fetch correlations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch('/api/correlations', { method: 'POST' });
      const data = await res.json();
      setCorrelations(data.data || []);
    } catch (error) {
      console.error('Failed to recalculate:', error);
    } finally {
      setRecalculating(false);
    }
  }

  function getCorrelationIcon(correlation: number) {
    if (Math.abs(correlation) < 0.1) {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    if (correlation > 0) {
      return <TrendingUp className="w-4 h-4 text-red-400" />;
    }
    return <TrendingDown className="w-4 h-4 text-emerald-400" />;
  }

  function getCorrelationColor(correlation: number) {
    const abs = Math.abs(correlation);
    if (abs < 0.1) return 'text-gray-500';
    if (abs < 0.4) return correlation > 0 ? 'text-yellow-400' : 'text-blue-400';
    if (abs < 0.7) return correlation > 0 ? 'text-orange-400' : 'text-emerald-400';
    return correlation > 0 ? 'text-red-400' : 'text-emerald-400';
  }

  function getStrengthBadge(strength: string) {
    const colors: Record<string, string> = {
      STRONG_POSITIVE: 'bg-red-500/20 text-red-400 border-red-500/30',
      MODERATE_POSITIVE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      WEAK_POSITIVE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      NONE: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      WEAK_NEGATIVE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      MODERATE_NEGATIVE: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      STRONG_NEGATIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    
    const labels: Record<string, string> = {
      STRONG_POSITIVE: 'Strong ↑',
      MODERATE_POSITIVE: 'Moderate ↑',
      WEAK_POSITIVE: 'Weak ↑',
      NONE: 'None',
      WEAK_NEGATIVE: 'Weak ↓',
      MODERATE_NEGATIVE: 'Moderate ↓',
      STRONG_NEGATIVE: 'Strong ↓',
    };

    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${colors[strength] || colors.NONE}`}>
        {labels[strength] || strength}
      </span>
    );
  }

  // Filter to show only meaningful correlations (not NONE)
  const meaningfulCorrelations = correlations.filter(c => c.strength !== 'NONE');

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Risk Correlations</h3>
          <p className="text-xs text-gray-500 mt-0.5">Detected patterns in your engineering signals</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRecalculate}
          disabled={recalculating}
        >
          {recalculating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh
        </Button>
      </div>

      {meaningfulCorrelations.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No correlations detected yet</p>
          <p className="text-xs text-gray-500 mt-1">
            Connect your Git and CI/CD integrations to detect patterns
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {meaningfulCorrelations.slice(0, 5).map((correlation) => (
            <div
              key={correlation.id}
              className="p-3 rounded-lg bg-surface-2 border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getCorrelationIcon(correlation.correlation)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">
                      {correlation.signalALabel}
                    </span>
                    <span className="text-xs text-gray-600">→</span>
                    <span className="text-xs text-gray-400">
                      {correlation.signalBLabel}
                    </span>
                    {getStrengthBadge(correlation.strength)}
                  </div>
                  {correlation.insight && (
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {correlation.insight}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-sm font-semibold ${getCorrelationColor(correlation.correlation)}`}>
                      r = {correlation.correlation.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {correlation.sampleSize} data points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
