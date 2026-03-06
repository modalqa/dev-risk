import { prisma } from './prisma';

// Correlation strength thresholds
const CORRELATION_THRESHOLDS = {
  STRONG_POSITIVE: 0.7,
  MODERATE_POSITIVE: 0.4,
  WEAK_POSITIVE: 0.1,
  WEAK_NEGATIVE: -0.1,
  MODERATE_NEGATIVE: -0.4,
  STRONG_NEGATIVE: -0.7,
};

// Signal definitions for correlation analysis
export const SIGNALS = {
  // Engineering signals
  pr_size: { label: 'PR Size (LOC)', unit: 'lines', source: 'git' },
  review_duration: { label: 'Review Duration', unit: 'hours', source: 'git' },
  files_changed: { label: 'Files Changed', unit: 'files', source: 'git' },
  failed_build_rate: { label: 'Failed Build Rate', unit: '%', source: 'cicd' },
  test_coverage: { label: 'Test Coverage', unit: '%', source: 'cicd' },
  deployment_frequency: { label: 'Deployment Frequency', unit: 'per week', source: 'cicd' },
  
  // Risk signals
  incident_count: { label: 'Incident Count', unit: 'incidents', source: 'risk' },
  high_severity_risks: { label: 'High/Critical Risks', unit: 'risks', source: 'risk' },
  risk_score_avg: { label: 'Avg Risk Score', unit: 'score', source: 'risk' },
  
  // User journey signals  
  dropoff_rate: { label: 'Drop-off Rate', unit: '%', source: 'user_journey' },
  stability_score: { label: 'Journey Stability', unit: 'score', source: 'user_journey' },
};

export type SignalKey = keyof typeof SIGNALS;

interface CorrelationResult {
  signalA: string;
  signalB: string;
  correlation: number;
  strength: string;
  sampleSize: number;
  insight: string;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n < 3) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Determine correlation strength from coefficient
 */
function getCorrelationStrength(correlation: number): string {
  if (correlation >= CORRELATION_THRESHOLDS.STRONG_POSITIVE) return 'STRONG_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.MODERATE_POSITIVE) return 'MODERATE_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.WEAK_POSITIVE) return 'WEAK_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.WEAK_NEGATIVE) return 'NONE';
  if (correlation >= CORRELATION_THRESHOLDS.MODERATE_NEGATIVE) return 'WEAK_NEGATIVE';
  if (correlation >= CORRELATION_THRESHOLDS.STRONG_NEGATIVE) return 'MODERATE_NEGATIVE';
  return 'STRONG_NEGATIVE';
}

/**
 * Generate human-readable insight from correlation
 */
function generateInsight(signalA: string, signalB: string, correlation: number): string {
  const signalAInfo = SIGNALS[signalA as SignalKey];
  const signalBInfo = SIGNALS[signalB as SignalKey];
  
  if (!signalAInfo || !signalBInfo) return '';

  const absCorrelation = Math.abs(correlation);
  const direction = correlation > 0 ? 'increases' : 'decreases';
  const inverseDirection = correlation > 0 ? 'decrease' : 'increase';
  
  let strength = '';
  if (absCorrelation >= 0.7) strength = 'strongly';
  else if (absCorrelation >= 0.4) strength = 'moderately';
  else if (absCorrelation >= 0.1) strength = 'slightly';
  else return `No significant correlation found between ${signalAInfo.label} and ${signalBInfo.label}.`;

  // Generate actionable insight based on signal types
  if (signalA === 'pr_size' && signalB === 'incident_count') {
    if (correlation > 0.4) {
      return `Large PRs are ${strength} correlated with more incidents. Consider breaking down PRs into smaller, focused changes to reduce risk.`;
    }
  }
  
  if (signalA === 'review_duration' && signalB === 'failed_build_rate') {
    if (correlation < -0.3) {
      return `Longer code reviews correlate with fewer build failures. Encouraging thorough reviews may improve build stability.`;
    }
  }

  if (signalA === 'test_coverage' && signalB === 'incident_count') {
    if (correlation < -0.3) {
      return `Higher test coverage ${strength} correlates with fewer incidents. Investing in testing may reduce production issues.`;
    }
  }

  if (signalA === 'deployment_frequency' && signalB === 'dropoff_rate') {
    if (correlation > 0.4) {
      return `Frequent deployments correlate with higher user drop-off. Consider stabilization periods between releases.`;
    }
  }

  return `When ${signalAInfo.label} ${direction}, ${signalBInfo.label} tends to ${inverseDirection} (r=${correlation.toFixed(2)}).`;
}

/**
 * Fetch signal data for a tenant over a period
 */
async function fetchSignalData(
  tenantId: string,
  signal: SignalKey,
  periodDays: number = 30
): Promise<{ date: Date; value: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  switch (signal) {
    case 'pr_size': {
      const data = await prisma.pullRequestData.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        select: { createdAt: true, linesAdded: true, linesDeleted: true },
        orderBy: { createdAt: 'asc' },
      });
      return data.map(d => ({ date: d.createdAt, value: d.linesAdded + d.linesDeleted }));
    }

    case 'review_duration': {
      const data = await prisma.pullRequestData.findMany({
        where: { tenantId, createdAt: { gte: startDate }, reviewDurationHrs: { not: null } },
        select: { createdAt: true, reviewDurationHrs: true },
        orderBy: { createdAt: 'asc' },
      });
      return data.map(d => ({ date: d.createdAt, value: d.reviewDurationHrs || 0 }));
    }

    case 'files_changed': {
      const data = await prisma.pullRequestData.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        select: { createdAt: true, filesChanged: true },
        orderBy: { createdAt: 'asc' },
      });
      return data.map(d => ({ date: d.createdAt, value: d.filesChanged }));
    }

    case 'failed_build_rate': {
      const data = await prisma.buildData.findMany({
        where: { tenantId, startedAt: { gte: startDate } },
        select: { startedAt: true, status: true },
        orderBy: { startedAt: 'asc' },
      });
      // Group by week and calculate failure rate
      const weeklyData = groupByWeek(data, d => d.startedAt!);
      return weeklyData.map(week => ({
        date: week.date,
        value: week.items.filter(d => d.status === 'failure').length / Math.max(week.items.length, 1) * 100,
      }));
    }

    case 'test_coverage': {
      const data = await prisma.buildData.findMany({
        where: { tenantId, startedAt: { gte: startDate }, testCoverage: { not: null } },
        select: { startedAt: true, testCoverage: true },
        orderBy: { startedAt: 'asc' },
      });
      return data.map(d => ({ date: d.startedAt!, value: d.testCoverage || 0 }));
    }

    case 'deployment_frequency': {
      const data = await prisma.buildData.findMany({
        where: { tenantId, startedAt: { gte: startDate }, status: 'success' },
        select: { startedAt: true },
        orderBy: { startedAt: 'asc' },
      });
      // Group by week and count
      const weeklyData = groupByWeek(data, d => d.startedAt!);
      return weeklyData.map(week => ({ date: week.date, value: week.items.length }));
    }

    case 'incident_count': {
      const data = await prisma.risk.findMany({
        where: { 
          tenantId, 
          createdAt: { gte: startDate },
          severity: { in: ['HIGH', 'CRITICAL'] },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      // Group by week and count
      const weeklyData = groupByWeek(data, d => d.createdAt);
      return weeklyData.map(week => ({ date: week.date, value: week.items.length }));
    }

    case 'high_severity_risks': {
      const data = await prisma.risk.findMany({
        where: { 
          tenantId, 
          createdAt: { gte: startDate },
          severity: { in: ['HIGH', 'CRITICAL'] },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
      const weeklyData = groupByWeek(data, d => d.createdAt);
      return weeklyData.map(week => ({ date: week.date, value: week.items.length }));
    }

    case 'risk_score_avg': {
      const data = await prisma.risk.findMany({
        where: { tenantId, createdAt: { gte: startDate } },
        select: { createdAt: true, score: true },
        orderBy: { createdAt: 'asc' },
      });
      const weeklyData = groupByWeek(data, d => d.createdAt);
      return weeklyData.map(week => ({
        date: week.date,
        value: week.items.reduce((sum, d) => sum + d.score, 0) / Math.max(week.items.length, 1),
      }));
    }

    case 'dropoff_rate': {
      const data = await prisma.userJourneyFlow.findMany({
        where: { tenantId },
        select: { updatedAt: true, dropoffRate: true },
        orderBy: { updatedAt: 'asc' },
      });
      return data.map(d => ({ date: d.updatedAt, value: d.dropoffRate * 100 }));
    }

    case 'stability_score': {
      const data = await prisma.userJourneyFlow.findMany({
        where: { tenantId },
        select: { updatedAt: true, stabilityScore: true },
        orderBy: { updatedAt: 'asc' },
      });
      return data.map(d => ({ date: d.updatedAt, value: d.stabilityScore * 100 }));
    }

    default:
      return [];
  }
}

/**
 * Group data by week
 */
function groupByWeek<T>(data: T[], getDate: (item: T) => Date): { date: Date; items: T[] }[] {
  const weeks = new Map<string, { date: Date; items: T[] }>();
  
  for (const item of data) {
    const date = getDate(item);
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString();
    
    if (!weeks.has(key)) {
      weeks.set(key, { date: weekStart, items: [] });
    }
    weeks.get(key)!.items.push(item);
  }
  
  return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Align two signal arrays by date/week
 */
function alignSignals(
  dataA: { date: Date; value: number }[],
  dataB: { date: Date; value: number }[]
): { valuesA: number[]; valuesB: number[] } {
  // Group both by week
  const weekMapA = new Map<string, number>();
  const weekMapB = new Map<string, number>();

  for (const d of dataA) {
    const weekKey = getWeekKey(d.date);
    weekMapA.set(weekKey, (weekMapA.get(weekKey) || 0) + d.value);
  }
  
  for (const d of dataB) {
    const weekKey = getWeekKey(d.date);
    weekMapB.set(weekKey, (weekMapB.get(weekKey) || 0) + d.value);
  }

  // Find common weeks
  const commonWeeks = Array.from(weekMapA.keys()).filter(k => weekMapB.has(k));
  
  const valuesA = commonWeeks.map(k => weekMapA.get(k)!);
  const valuesB = commonWeeks.map(k => weekMapB.get(k)!);

  return { valuesA, valuesB };
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate correlations between signal pairs
 */
export async function calculateCorrelations(
  tenantId: string,
  periodDays: number = 30
): Promise<CorrelationResult[]> {
  // Define which signal pairs to correlate
  const signalPairs: [SignalKey, SignalKey][] = [
    ['pr_size', 'incident_count'],
    ['pr_size', 'failed_build_rate'],
    ['review_duration', 'incident_count'],
    ['review_duration', 'failed_build_rate'],
    ['test_coverage', 'incident_count'],
    ['deployment_frequency', 'incident_count'],
    ['deployment_frequency', 'dropoff_rate'],
    ['failed_build_rate', 'incident_count'],
    ['files_changed', 'incident_count'],
  ];

  const results: CorrelationResult[] = [];

  for (const [signalA, signalB] of signalPairs) {
    try {
      const dataA = await fetchSignalData(tenantId, signalA, periodDays);
      const dataB = await fetchSignalData(tenantId, signalB, periodDays);

      if (dataA.length < 3 || dataB.length < 3) continue;

      const { valuesA, valuesB } = alignSignals(dataA, dataB);
      
      if (valuesA.length < 3) continue;

      const correlation = pearsonCorrelation(valuesA, valuesB);
      const strength = getCorrelationStrength(correlation);
      const insight = generateInsight(signalA, signalB, correlation);

      results.push({
        signalA,
        signalB,
        correlation: Math.round(correlation * 100) / 100,
        strength,
        sampleSize: valuesA.length,
        insight,
      });
    } catch (error) {
      console.error(`Error calculating correlation for ${signalA}-${signalB}:`, error);
    }
  }

  return results;
}

/**
 * Save correlation results to database
 */
export async function saveCorrelations(
  tenantId: string,
  results: CorrelationResult[],
  periodDays: number
): Promise<void> {
  for (const result of results) {
    await prisma.riskCorrelation.upsert({
      where: {
        tenantId_signalA_signalB: {
          tenantId,
          signalA: result.signalA,
          signalB: result.signalB,
        },
      },
      create: {
        tenantId,
        signalA: result.signalA,
        signalB: result.signalB,
        correlation: result.correlation,
        strength: result.strength as any,
        sampleSize: result.sampleSize,
        periodDays,
        insight: result.insight,
      },
      update: {
        correlation: result.correlation,
        strength: result.strength as any,
        sampleSize: result.sampleSize,
        periodDays,
        insight: result.insight,
        calculatedAt: new Date(),
      },
    });
  }
}

/**
 * Get cached correlations for a tenant
 */
export async function getCorrelations(tenantId: string) {
  return prisma.riskCorrelation.findMany({
    where: { tenantId },
    orderBy: [
      { correlation: 'desc' },
    ],
  });
}

/**
 * Recalculate all correlations for a tenant
 */
export async function recalculateCorrelations(
  tenantId: string,
  periodDays: number = 30
): Promise<CorrelationResult[]> {
  const results = await calculateCorrelations(tenantId, periodDays);
  await saveCorrelations(tenantId, results, periodDays);
  return results;
}
