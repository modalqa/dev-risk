import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import { prisma } from '@/lib/prisma';
import Badge from '@/components/ui/Badge';
import {
  getSeverityBadgeClass, getStatusBadgeClass, getCategoryLabel, formatDate,
} from '@/lib/utils';
import { AlertTriangle, Filter } from 'lucide-react';
import AddRiskButton from './AddRiskButton';
import RiskFilterBar from './RiskFilterBar';
import RiskActions from './RiskActions';

async function getRisks(tenantId: string, filters: Record<string, string>) {
  const where: Record<string, unknown> = { tenantId };
  if (filters.severity) where.severity = filters.severity;
  if (filters.category) where.category = filters.category;
  if (filters.status)   where.status   = filters.status;
  if (filters.releaseId) where.releaseId = filters.releaseId;

  return prisma.risk.findMany({
    where,
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    include: { release: { select: { version: true, id: true } } },
    take: 100,
  });
}

async function getReleases(tenantId: string) {
  return prisma.release.findMany({
    where: { tenantId },
    select: { id: true, version: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export default async function RisksPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [risks, releases] = await Promise.all([
    getRisks(user.tenantId, searchParams),
    getReleases(user.tenantId)
  ]);

  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedRisks = [...risks].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  const criticalCount = risks.filter((r: any) => r.severity === 'CRITICAL').length;
  const highCount = risks.filter((r: any) => r.severity === 'HIGH').length;
  const openCount = risks.filter((r: any) => r.status === 'OPEN' || r.status === 'IN_PROGRESS').length;

  return (
    <>
      <Header title="Risk Management" subtitle="Track and mitigate engineering risks" />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total Risks', value: risks.length, color: 'text-white' },
            { label: 'Critical', value: criticalCount, color: 'text-red-400' },
            { label: 'High', value: highCount, color: 'text-orange-400' },
            { label: 'Open/Active', value: openCount, color: 'text-yellow-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-xl border border-border p-4">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter + Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <RiskFilterBar currentFilters={searchParams} />
          {user.role !== 'VIEWER' && <AddRiskButton tenantId={user.tenantId} />}
        </div>

        {/* Risks table */}
        {sortedRisks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertTriangle className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">No risks found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedRisks.map((risk) => (
              <div
                key={risk.id}
                className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border hover:bg-surface-2 transition-colors"
              >
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      risk.severity === 'CRITICAL' ? '#dc2626' :
                      risk.severity === 'HIGH' ? '#ef4444' :
                      risk.severity === 'MEDIUM' ? '#f59e0b' : '#10b981',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{risk.title}</span>
                    <Badge className={getSeverityBadgeClass(risk.severity)} size="sm">{risk.severity}</Badge>
                    <Badge className={getStatusBadgeClass(risk.status)} size="sm">{risk.status.replace('_', ' ')}</Badge>
                    <Badge className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] px-1.5 py-0.5">{getCategoryLabel(risk.category)}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{risk.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-gray-600">{formatDate(risk.createdAt)}</span>
                    {risk.release && (
                      <span className="text-[10px] text-gray-500">Release: <span className="text-gray-400">{risk.release.version}</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div className="text-center">
                    <p className={`text-sm font-bold ${risk.score >= 75 ? 'text-red-400' : risk.score >= 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {risk.score.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-gray-600">score</p>
                  </div>
                  
                  {user.role !== 'VIEWER' && (
                    <RiskActions 
                      risk={risk} 
                      releases={releases}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
