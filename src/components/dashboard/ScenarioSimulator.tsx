'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Sliders, Play, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScenarioResult {
  baselineRiskIndex: number;
  predictedRiskIndex: number;
  riskChange: number;
  riskChangePercent: number;
  newRiskLevel: string;
  explanation: string;
}

export default function ScenarioSimulator() {
  const [deploymentChange, setDeploymentChange] = useState(0);
  const [prSizeChange, setPrSizeChange] = useState(0);
  const [coverageChange, setCoverageChange] = useState(0);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSimulation() {
    setLoading(true);
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deploymentFrequencyChange: deploymentChange / 100,
          prSizeChange: prSizeChange / 100,
          testCoverageChange: coverageChange / 100,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setLoading(false);
    }
  }

  function getRiskLevelBadge(level: string) {
    switch (level) {
      case 'CRITICAL':
        return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">Critical</Badge>;
      case 'HIGH':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low</Badge>;
    }
  }

  function getChangeIcon(change: number) {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  }

  function getChangeColor(change: number) {
    if (change > 0) return 'text-red-400';
    if (change < 0) return 'text-emerald-400';
    return 'text-gray-400';
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-primary" />
          What-If Scenario Simulator
        </h3>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Simulate how changes in engineering metrics would affect your risk index.
      </p>

      {/* Sliders */}
      <div className="space-y-4 mb-5">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">Deployment Frequency</label>
            <span className={`text-xs font-medium ${deploymentChange > 0 ? 'text-red-400' : deploymentChange < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {deploymentChange > 0 ? '+' : ''}{deploymentChange}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={deploymentChange}
            onChange={(e) => setDeploymentChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>-50%</span>
            <span>0</span>
            <span>+50%</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">PR Size (LOC)</label>
            <span className={`text-xs font-medium ${prSizeChange > 0 ? 'text-red-400' : prSizeChange < 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
              {prSizeChange > 0 ? '+' : ''}{prSizeChange}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={prSizeChange}
            onChange={(e) => setPrSizeChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>-50%</span>
            <span>0</span>
            <span>+50%</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-gray-400">Test Coverage</label>
            <span className={`text-xs font-medium ${coverageChange > 0 ? 'text-emerald-400' : coverageChange < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {coverageChange > 0 ? '+' : ''}{coverageChange}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="5"
            value={coverageChange}
            onChange={(e) => setCoverageChange(parseInt(e.target.value))}
            className="w-full h-1.5 bg-surface-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>-50%</span>
            <span>0</span>
            <span>+50%</span>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <Button 
        onClick={runSimulation} 
        disabled={loading || (deploymentChange === 0 && prSizeChange === 0 && coverageChange === 0)}
        className="w-full mb-4"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Simulating...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Run Simulation
          </span>
        )}
      </Button>

      {/* Results */}
      {result && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Current</p>
              <p className="text-2xl font-bold text-white">{result.baselineRiskIndex}</p>
            </div>
            <div className="flex flex-col items-center">
              <ArrowRight className="w-5 h-5 text-gray-500" />
              <div className={`flex items-center gap-1 text-xs ${getChangeColor(result.riskChange)}`}>
                {getChangeIcon(result.riskChange)}
                <span>{result.riskChange > 0 ? '+' : ''}{result.riskChange}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Predicted</p>
              <p className={`text-2xl font-bold ${result.riskChange > 0 ? 'text-red-400' : result.riskChange < 0 ? 'text-emerald-400' : 'text-white'}`}>
                {result.predictedRiskIndex}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xs text-gray-400">New Risk Level:</span>
            {getRiskLevelBadge(result.newRiskLevel)}
          </div>

          <p className="text-xs text-gray-400 text-center bg-surface-2 rounded-lg p-3">
            {result.explanation}
          </p>
        </div>
      )}
    </Card>
  );
}
