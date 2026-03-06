import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import StatsCard from '@/components/ui/StatsCard';
import Card from '@/components/ui/Card';
import { prisma } from '@/lib/prisma';
import RiskTrendChart from '@/components/dashboard/RiskTrendChart';
import HighRiskReleases from '@/components/dashboard/HighRiskReleases';
import UserJourneyHeatmap from '@/components/dashboard/UserJourneyHeatmap';
import CorrelationInsights from '@/components/dashboard/CorrelationInsights';
import RiskForecastCard from '@/components/dashboard/RiskForecastCard';
import ScenarioSimulator from '@/components/dashboard/ScenarioSimulator';
import {
  ShieldAlert, GitBranch, AlertTriangle, Activity, TrendingUp,
} from 'lucide-react';
import { getRiskIndexColor } from '@/lib/utils';
import { Release, TrendPoint } from '@/types';

async function getDashboardData(tenantId: string) {
  const now = new Date();

  const [releases, openRisksCount, criticalRisksCount, flows] = await Promise.all([
    prisma.release.findMany({
      where: { tenantId },
      orderBy: { deploymentDate: 'desc' },
      take: 10,
    }),
    prisma.risk.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.risk.count({ where: { tenantId, severity: { in: ['CRITICAL', 'HIGH'] }, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.userJourneyFlow.findMany({ where: { tenantId }, orderBy: { stabilityScore: 'asc' } }),
  ]);

  const latestRelease = releases[0];
  const releaseRiskIndex = latestRelease?.releaseRiskIndex ?? 0;
  const engineeringScore = latestRelease?.engineeringScore ?? 0;
  const userJourneyScore = (latestRelease?.userJourneyScore ?? 0) * 100;

  const highRiskReleases = releases
    .filter((r: any) => r.releaseRiskIndex >= 50)
    .slice(0, 5)
    .map((r: any) => ({
      ...r,
      deploymentDate: r.deploymentDate.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })) as Release[];

  // Generate 30-day trend
  const riskTrend: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const label = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    const matchingRelease = releases.find((r) => {
      const rd = new Date(r.deploymentDate);
      return Math.abs(rd.getTime() - date.getTime()) < 4 * 24 * 60 * 60 * 1000;
    });
    if (matchingRelease) {
      riskTrend.push({ date: label, riskIndex: matchingRelease.releaseRiskIndex, engineeringScore: matchingRelease.engineeringScore * 100 });
    } else {
      const noise = (Math.sin(i * 0.4) * 10) + (Math.cos(i * 0.7) * 5);
      riskTrend.push({
        date: label,
        riskIndex: Math.max(5, Math.min(95, releaseRiskIndex + noise)),
        engineeringScore: Math.max(20, Math.min(90, engineeringScore * 100 - noise * 0.4)),
      });
    }
  }

  return {
    releaseRiskIndex,
    engineeringScore,
    userJourneyScore,
    openRisksCount,
    criticalRisksCount,
    deploymentsCount: releases.filter((r) => r.status === 'DEPLOYED').length,
    highRiskReleases,
    riskTrend,
    flows: flows.map((f: any) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    })),
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const data = await getDashboardData(user.tenantId);

  return (
    <>
      <Header
        title="Executive Risk Dashboard"
        subtitle="AI-powered engineering risk intelligence"
      />

      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Release Risk Index"
            value={`${data.releaseRiskIndex.toFixed(0)}/100`}
            subtitle="Latest release risk"
            icon={<ShieldAlert className="w-5 h-5" />}
            valueClassName={getRiskIndexColor(data.releaseRiskIndex)}
          />
          <StatsCard
            title="Engineering Stability"
            value={`${(data.engineeringScore * 100).toFixed(0)}%`}
            subtitle="Code & process health"
            icon={<Activity className="w-5 h-5" />}
            valueClassName={data.engineeringScore > 0.6 ? 'text-emerald-400' : data.engineeringScore > 0.4 ? 'text-yellow-400' : 'text-red-400'}
          />
          <StatsCard
            title="User Journey Stability"
            value={`${data.userJourneyScore.toFixed(0)}%`}
            subtitle="Critical flow health"
            icon={<TrendingUp className="w-5 h-5" />}
            valueClassName={data.userJourneyScore > 60 ? 'text-emerald-400' : data.userJourneyScore > 40 ? 'text-yellow-400' : 'text-red-400'}
          />
          <StatsCard
            title="Open Risk Items"
            value={data.openRisksCount}
            subtitle={`${data.criticalRisksCount} critical/high`}
            icon={<AlertTriangle className="w-5 h-5" />}
            valueClassName={data.criticalRisksCount > 3 ? 'text-red-400' : 'text-yellow-400'}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Risk Trend (30 Day)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Risk index vs engineering stability</p>
              </div>
            </div>
            <div className="h-[240px]">
              <RiskTrendChart data={data.riskTrend} />
            </div>
          </Card>

          <Card className="max-h-[340px] overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">High-Risk Releases</h3>
              <p className="text-xs text-gray-500 mt-0.5">Risk index ≥ 50</p>
            </div>
            <HighRiskReleases releases={data.highRiskReleases} />
          </Card>
        </div>

        {/* User Journey Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">User Journey Risk Heatmap</h3>
                <p className="text-xs text-gray-500 mt-0.5">Stability per critical flow</p>
              </div>
            </div>
            <UserJourneyHeatmap flows={data.flows} />
          </Card>

          {/* Correlation Insights */}
          <CorrelationInsights />
        </div>

        {/* Phase 3: Predictive Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risk Forecast */}
          <RiskForecastCard />

          {/* Scenario Simulator */}
          <ScenarioSimulator />
        </div>
      </div>
    </>
  );
}
