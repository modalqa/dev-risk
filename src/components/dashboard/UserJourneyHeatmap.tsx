import { UserJourneyFlow } from '@/types';
import { cn } from '@/lib/utils';

interface UserJourneyHeatmapProps {
  flows: UserJourneyFlow[];
}

function getHeatColor(stabilityScore: number): string {
  if (stabilityScore >= 0.8) return 'bg-emerald-500/20 border-emerald-500/30';
  if (stabilityScore >= 0.6) return 'bg-yellow-500/20 border-yellow-500/30';
  if (stabilityScore >= 0.4) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

function getTextColor(stabilityScore: number): string {
  if (stabilityScore >= 0.8) return 'text-emerald-400';
  if (stabilityScore >= 0.6) return 'text-yellow-400';
  if (stabilityScore >= 0.4) return 'text-orange-400';
  return 'text-red-400';
}

export default function UserJourneyHeatmap({ flows }: UserJourneyHeatmapProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {flows.map((flow) => (
        <div
          key={flow.id}
          className={cn(
            'rounded-lg border p-3 transition-all hover:scale-[1.02]',
            getHeatColor(flow.stabilityScore)
          )}
        >
          <p className="text-xs font-medium text-white mb-2 leading-tight">{flow.name}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className={`text-xl font-bold ${getTextColor(flow.stabilityScore)}`}>
                {(flow.stabilityScore * 100).toFixed(0)}
                <span className="text-xs font-normal">%</span>
              </p>
              <p className="text-[10px] text-gray-500">stability</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {(flow.dropoffRate * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-gray-500">drop-off</p>
            </div>
          </div>
          {flow.incidentCount > 0 && (
            <p className="text-[10px] text-orange-400 mt-1">
              {flow.incidentCount} incident
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
