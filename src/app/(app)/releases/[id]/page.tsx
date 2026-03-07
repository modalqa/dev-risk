import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { prisma } from '@/lib/prisma';
import RunAnalysisButton from '@/components/RunAnalysisButton';
import {
  getStatusBadgeClass, getSeverityBadgeClass, getRiskIndexColor,
  getCategoryLabel, formatDate, getRiskIndexBg,
} from '@/lib/utils';
import {
  ShieldAlert, Calendar, Code2, TestTube, Zap,
  GitPullRequest, AlertTriangle, TrendingUp, Activity, Lightbulb,
  Sparkles, Clock,
} from 'lucide-react';
import RiskIndexGauge from '@/components/dashboard/RiskIndexGauge';
import SuggestRiskButton from '@/components/SuggestRiskButton';
import Link from 'next/link';

async function getRelease(id: string, tenantId: string) {
  return prisma.release.findFirst({
    where: { id, tenantId },
    include: {
      risks: { orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }] },
    },
  });
}

async function getLatestAnalysis(releaseId: string, tenantId: string) {
  return prisma.aiAnalysisResult.findFirst({
    where: { releaseId, tenantId, analysisType: 'release_risk_analysis' },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ReleaseDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const release = await getRelease(params.id, user.tenantId);
  if (!release) notFound();

  const savedAnalysis = await getLatestAnalysis(release.id, user.tenantId);

  // Parse the AI analysis output from the saved record
  const aiResult = savedAnalysis?.recommendations as {
    recommendationLevel?: 'HOLD' | 'REVIEW' | 'PROCEED' | 'CLEAR';
    recommendation?: string;
    summary?: string;
    rootCause?: string;
    riskProjection?: string;
    engineeringInsight?: string;
    bestPractices?: string[];
    affectedUsers?: { min: number; max: number };
  } | null;

  const hasRisks = release.risks.length > 0;
  const hasAnalysis = !!aiResult?.recommendation;

  // When no risks, display risk index as 0
  const displayRiskIndex = hasRisks ? release.releaseRiskIndex : 0;
  const displayEngScore = hasRisks ? release.engineeringScore : 0;
  const displayUjScore = hasRisks ? release.userJourneyScore : 0;

  const recBgMap = {
    HOLD:    'bg-red-500/10 border-red-500/30',
    REVIEW:  'bg-yellow-500/10 border-yellow-500/30',
    PROCEED: 'bg-blue-500/10 border-blue-500/30',
    CLEAR:   'bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <>
      <Header
        title={`Release ${release.version}`}
        subtitle={`Risk Analysis — ${formatDate(release.deploymentDate)}`}
      />

      <div className="p-6 space-y-5">
        {/* Top: Scores + Risk Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Gauges */}
          <Card className="flex flex-col items-center justify-center py-6 gap-2">
            <RiskIndexGauge value={displayRiskIndex} label="Release Risk Index" size="lg" />
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className={`text-lg font-bold ${displayEngScore > 0.6 ? 'text-emerald-400' : displayEngScore > 0.4 ? 'text-yellow-400' : displayEngScore > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {(displayEngScore * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-gray-500">Engineering</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${displayUjScore > 0.6 ? 'text-emerald-400' : displayUjScore > 0.4 ? 'text-yellow-400' : displayUjScore > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {(displayUjScore * 100).toFixed(0)}%
                </p>
                <p className="text-[10px] text-gray-500">User Journey</p>
              </div>
            </div>
            <Badge className={getStatusBadgeClass(release.status)} size="sm">
              {release.status}
            </Badge>
          </Card>

          {/* Risk Analysis Panel */}
          <Card className="lg:col-span-2">
            {/* ── State 1: No risks at all ── */}
            {!hasRisks && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-white">Risk Analysis</h3>
                </div>
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-4">
                    <ShieldAlert className="w-6 h-6 text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-400 mb-1">No risk items yet</p>
                  <p className="text-xs text-gray-600 max-w-sm">
                    Add risk items to this release to begin analysis.
                    AI will process each risk and provide a dynamic assessment.
                  </p>
                </div>
              </>
            )}

            {/* ── State 2: Has risks, no analysis yet ── */}
            {hasRisks && !hasAnalysis && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary-light" />
                    <h3 className="text-sm font-semibold text-white">Risk Analysis</h3>
                  </div>
                  {user.role !== 'VIEWER' && (
                    <RunAnalysisButton releaseId={release.id} />
                  )}
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary-light/10 border border-primary-light/20 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary-light" />
                  </div>
                  <p className="text-sm text-gray-300 mb-1">
                    {release.risks.length} risk{release.risks.length > 1 ? 's' : ''} identified
                  </p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Run AI Analysis to get an in-depth assessment —
                    deployment recommendation, root cause analysis, risk projection, and best practices.
                  </p>
                </div>
              </>
            )}

            {/* ── State 3: Has analysis from AI ── */}
            {hasRisks && hasAnalysis && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-light" />
                    <h3 className="text-sm font-semibold text-white">Risk Analysis</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedAnalysis && (
                      <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock className="w-3 h-3" />
                        {new Date(savedAnalysis.createdAt).toLocaleString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    )}
                    <Badge className="bg-primary-light/10 text-primary-light border border-primary-light/20 text-[10px] px-2 py-0.5" size="sm">
                      AI-powered
                    </Badge>
                    {user.role !== 'VIEWER' && (
                      <RunAnalysisButton releaseId={release.id} hasExistingAnalysis />
                    )}
                  </div>
                </div>

                {/* Recommendation */}
                <div className={`rounded-lg border p-3.5 mb-3 ${recBgMap[aiResult!.recommendationLevel || 'REVIEW']}`}>
                  <p className="text-sm text-white leading-relaxed">{aiResult!.recommendation}</p>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-400 mb-2 leading-relaxed">{aiResult!.summary}</p>

                {/* Root Cause */}
                <p className="text-xs text-gray-500 leading-relaxed">{aiResult!.rootCause}</p>

                {/* Risk Projection */}
                {aiResult!.riskProjection && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-gray-400 mb-1">Risk Projection</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{aiResult!.riskProjection}</p>
                  </div>
                )}

                {/* Engineering Insight */}
                {aiResult!.engineeringInsight && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-medium text-gray-400 mb-1">Engineering Insight</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{aiResult!.engineeringInsight}</p>
                  </div>
                )}

                {/* Best Practices */}
                {aiResult!.bestPractices && aiResult!.bestPractices.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                      <p className="text-xs font-medium text-gray-400">Best Practices & Recommendations</p>
                    </div>
                    <ul className="space-y-1.5">
                      {aiResult!.bestPractices.map((practice, idx) => (
                        <li key={idx} className="text-xs text-gray-500 leading-relaxed flex items-start gap-2">
                          <span className="text-primary-light mt-0.5">•</span>
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Engineering signals */}
        {release.prSize != null && (
          <Card>
            <h3 className="text-sm font-semibold text-white mb-4">Engineering Signals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: GitPullRequest, label: 'PR Size', value: `${release.prSize?.toLocaleString()} LOC`, warn: (release.prSize ?? 0) > 2000 },
                { icon: Code2, label: 'Review Duration', value: `${release.reviewDurationHours ?? '—'} hrs`, warn: (release.reviewDurationHours ?? 0) < 8 },
                { icon: Zap, label: 'Failed Build Rate', value: `${((release.failedBuildRate ?? 0) * 100).toFixed(0)}%`, warn: (release.failedBuildRate ?? 0) > 0.2 },
                { icon: TestTube, label: 'Test Coverage', value: `${release.testCoverage ?? '—'}%`, warn: (release.testCoverage ?? 100) < 60 },
                { icon: TrendingUp, label: 'Deploys/Week', value: `${release.deploymentsPerWeek ?? '—'}x`, warn: (release.deploymentsPerWeek ?? 0) > 8 },
                { icon: AlertTriangle, label: 'Reopened Issues', value: `${release.reopenedIssues ?? '—'}`, warn: (release.reopenedIssues ?? 0) > 5 },
              ].map((signal) => {
                const Icon = signal.icon;
                return (
                  <div
                    key={signal.label}
                    className={`p-3 rounded-lg border ${signal.warn ? 'bg-red-500/5 border-red-500/20' : 'bg-surface-2 border-border'}`}
                  >
                    <Icon className={`w-4 h-4 mb-2 ${signal.warn ? 'text-red-400' : 'text-gray-500'}`} />
                    <p className={`text-sm font-semibold ${signal.warn ? 'text-red-400' : 'text-white'}`}>{signal.value}</p>
                    <p className="text-[10px] text-gray-500">{signal.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Risk items */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Risk Items</h3>
              <p className="text-xs text-gray-500 mt-0.5">{release.risks.length} risks identified</p>
            </div>
            {user.role !== 'VIEWER' && (
              <div className="flex items-center gap-2">
                <SuggestRiskButton
                  releaseId={release.id}
                  hasDescription={!!release.description && release.description.trim().length > 0}
                />
                <Link
                  href={`/risks?releaseId=${release.id}`}
                  className="text-xs text-primary-light hover:text-primary transition-colors"
                >
                  + Add risk
                </Link>
              </div>
            )}
          </div>
          {release.risks.length === 0 ? (
            <div className="flex flex-col items-center py-6 gap-3">
              <p className="text-sm text-gray-500">No risk items yet</p>
              {user.role !== 'VIEWER' && release.description && release.description.trim().length > 0 && (
                <SuggestRiskButton
                  releaseId={release.id}
                  hasDescription={true}
                />
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {release.risks.map((risk: any) => (
                <div
                  key={risk.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-2 border border-border/50 hover:border-border transition-colors"
                >
                  <div
                    className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
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
                      <Badge className="bg-gray-500/20 text-gray-400 border border-gray-500/30 text-[10px] px-1.5 py-0.5" size="sm">{getCategoryLabel(risk.category)}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{risk.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-semibold ${risk.score >= 75 ? 'text-red-400' : risk.score >= 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {risk.score.toFixed(0)}
                    </p>
                    <p className="text-[10px] text-gray-600">score</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
