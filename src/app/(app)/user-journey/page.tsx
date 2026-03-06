import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import { prisma } from '@/lib/prisma';
import UserJourneyHeatmap from '@/components/dashboard/UserJourneyHeatmap';
import AddFlowButton from './AddFlowButton';
import { UserJourneyFlow } from '@/types';
import { calculateUserJourneyScore } from '@/lib/risk-engine';
import { Map, TrendingDown } from 'lucide-react';

async function getFlows(tenantId: string): Promise<UserJourneyFlow[]> {
  const flows = await prisma.userJourneyFlow.findMany({
    where: { tenantId },
    orderBy: { stabilityScore: 'asc' },
  });
  return flows.map((f: any) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));
}

export default async function UserJourneyPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const flows = await getFlows(user.tenantId);

  const avgStability = flows.length > 0
    ? flows.reduce((s, f) => s + f.stabilityScore, 0) / flows.length
    : 0;

  const criticalFlows = flows.filter((f) => f.stabilityScore < 0.4).length;
  const totalIncidents = flows.reduce((s, f) => s + f.incidentCount, 0);
  const avgDropoff = flows.length > 0
    ? flows.reduce((s, f) => s + f.dropoffRate, 0) / flows.length
    : 0;

  return (
    <>
      <Header 
        title="User Journey Risk" 
        subtitle="Critical flow stability and drop-off analysis"
        action={<AddFlowButton />}
      />

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Avg Stability', value: `${(avgStability * 100).toFixed(0)}%`, color: avgStability > 0.6 ? 'text-emerald-400' : avgStability > 0.4 ? 'text-yellow-400' : 'text-red-400' },
            { label: 'Critical Flows', value: criticalFlows, color: criticalFlows > 0 ? 'text-red-400' : 'text-emerald-400' },
            { label: 'Total Incidents', value: totalIncidents, color: totalIncidents > 5 ? 'text-orange-400' : 'text-yellow-400' },
            { label: 'Avg Drop-off Rate', value: `${(avgDropoff * 100).toFixed(0)}%`, color: avgDropoff > 0.2 ? 'text-red-400' : 'text-yellow-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Map className="w-4 h-4 text-primary-light" />
            <h3 className="text-sm font-semibold text-white">Journey Heatmap</h3>
          </div>
          <UserJourneyHeatmap flows={flows} />
        </Card>

        {/* Detail table */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-4">Flow Detail</h3>
          <div className="space-y-2">
            {flows.map((flow) => {
              const stabilityPct = flow.stabilityScore * 100;
              const barColor =
                flow.stabilityScore >= 0.8 ? 'bg-emerald-500' :
                flow.stabilityScore >= 0.6 ? 'bg-yellow-500' :
                flow.stabilityScore >= 0.4 ? 'bg-orange-500' :
                'bg-red-500';

              return (
                <div key={flow.id} className="flex items-center gap-4 p-3 rounded-lg bg-surface-2 border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{flow.name}</p>
                    {/* Progress bar */}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${stabilityPct}%` }} />
                      </div>
                      <span className={`text-xs font-medium w-8 text-right ${
                        flow.stabilityScore >= 0.8 ? 'text-emerald-400' :
                        flow.stabilityScore >= 0.6 ? 'text-yellow-400' :
                        flow.stabilityScore >= 0.4 ? 'text-orange-400' : 'text-red-400'
                      }`}>{stabilityPct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex gap-5 text-right flex-shrink-0">
                    <div>
                      <p className="text-sm font-semibold text-white">{(flow.dropoffRate * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-gray-500">Drop-off</p>
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${flow.incidentCount > 2 ? 'text-orange-400' : 'text-gray-300'}`}>
                        {flow.incidentCount}
                      </p>
                      <p className="text-[10px] text-gray-500">Incidents</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
