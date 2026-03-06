import { Release } from '@/types';
import { getRiskIndexColor, getStatusBadgeClass, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import Badge from '@/components/ui/Badge';

interface HighRiskReleasesProps {
  releases: Release[];
}

export default function HighRiskReleases({ releases }: HighRiskReleasesProps) {
  if (!releases.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">No high-risk releases</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {releases.map((release) => (
        <Link
          key={release.id}
          href={`/releases/${release.id}`}
          className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors group border border-border/50 hover:border-border"
        >
          {/* Risk indicator */}
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{
              backgroundColor:
                release.releaseRiskIndex >= 75 ? '#dc2626' :
                release.releaseRiskIndex >= 50 ? '#ef4444' :
                release.releaseRiskIndex >= 25 ? '#f59e0b' : '#10b981',
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{release.version}</span>
              <Badge className={getStatusBadgeClass(release.status)} size="sm">
                {release.status}
              </Badge>
            </div>
            {release.description && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{release.description}</p>
            )}
            <p className="text-xs text-gray-600 mt-0.5">{formatDate(release.deploymentDate)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className={`text-lg font-bold ${getRiskIndexColor(release.releaseRiskIndex)}`}>
                {release.releaseRiskIndex.toFixed(0)}
              </p>
              <p className="text-[10px] text-gray-600">Risk Index</p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
