import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import {
  getStatusBadgeClass, getRiskIndexColor, formatDate,
} from '@/lib/utils';
import { GitBranch, Plus, ArrowRight, Calendar, BarChart3 } from 'lucide-react';
import AddReleaseButton from './AddReleaseButton';

async function getReleases(tenantId: string) {
  return prisma.release.findMany({
    where: { tenantId },
    orderBy: { deploymentDate: 'desc' },
    include: {
      _count: { select: { risks: true } },
      risks: { select: { severity: true } },
    },
  });
}

export default async function ReleasesPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const releases = await getReleases(user.tenantId);

  return (
    <>
      <Header title="Releases" subtitle="Manage and analyze release risk" />

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-surface-2 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-border">
              <span className="text-xs text-gray-400">{releases.length} total</span>
            </div>
          </div>
          {user.role !== 'VIEWER' && <AddReleaseButton />}
        </div>

        {releases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GitBranch className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-400 font-medium">No releases yet</p>
            <p className="text-sm text-gray-600 mt-1">Create your first release to start tracking risks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {releases.map((release: any) => {
              const criticalCount = release.risks.filter((r: any) => r.severity === 'CRITICAL').length;
              const highCount = release.risks.filter((r: any) => r.severity === 'HIGH').length;

              return (
                <Link
                  key={release.id}
                  href={`/releases/${release.id}`}
                  className="flex items-center gap-4 p-4 bg-surface rounded-xl border border-border hover:border-border-2 hover:bg-surface-2 transition-all group"
                >
                  {/* Risk indicator bar */}
                  <div
                    className="w-1 h-12 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        release.releaseRiskIndex >= 75 ? '#dc2626' :
                        release.releaseRiskIndex >= 50 ? '#ef4444' :
                        release.releaseRiskIndex >= 25 ? '#f59e0b' : '#10b981',
                    }}
                  />

                  {/* Version + info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{release.version}</span>
                      <Badge className={getStatusBadgeClass(release.status)} size="sm">
                        {release.status}
                      </Badge>
                      {criticalCount > 0 && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30" size="sm">
                          {criticalCount} Critical
                        </Badge>
                      )}
                      {highCount > 0 && (
                        <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30" size="sm">
                          {highCount} High
                        </Badge>
                      )}
                    </div>
                    {release.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{release.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Calendar className="w-3 h-3" />
                        {formatDate(release.deploymentDate)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <BarChart3 className="w-3 h-3" />
                        {release._count.risks} risks
                      </span>
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className={`text-xl font-bold ${getRiskIndexColor(release.releaseRiskIndex)}`}>
                        {release.releaseRiskIndex.toFixed(0)}
                      </p>
                      <p className="text-[10px] text-gray-600">Risk Index</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${release.engineeringScore > 0.6 ? 'text-emerald-400' : release.engineeringScore > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {(release.engineeringScore * 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] text-gray-600">Eng. Score</p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-300 transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
