const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Correlation strength thresholds
const CORRELATION_THRESHOLDS = {
  STRONG_POSITIVE: 0.7,
  MODERATE_POSITIVE: 0.4,
  WEAK_POSITIVE: 0.1,
  WEAK_NEGATIVE: -0.1,
  MODERATE_NEGATIVE: -0.4,
  STRONG_NEGATIVE: -0.7,
};

function pearsonCorrelation(x, y) {
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

function getCorrelationStrength(correlation) {
  if (correlation >= CORRELATION_THRESHOLDS.STRONG_POSITIVE) return 'STRONG_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.MODERATE_POSITIVE) return 'MODERATE_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.WEAK_POSITIVE) return 'WEAK_POSITIVE';
  if (correlation >= CORRELATION_THRESHOLDS.WEAK_NEGATIVE) return 'NONE';
  if (correlation >= CORRELATION_THRESHOLDS.MODERATE_NEGATIVE) return 'WEAK_NEGATIVE';
  if (correlation >= CORRELATION_THRESHOLDS.STRONG_NEGATIVE) return 'MODERATE_NEGATIVE';
  return 'STRONG_NEGATIVE';
}

function generateInsight(signalA, signalB, correlation) {
  const absCorrelation = Math.abs(correlation);
  const direction = correlation > 0 ? 'increases' : 'decreases';
  
  let strength = '';
  if (absCorrelation >= 0.7) strength = 'strongly';
  else if (absCorrelation >= 0.4) strength = 'moderately';
  else if (absCorrelation >= 0.1) strength = 'slightly';
  else return `No significant correlation found between ${signalA} and ${signalB}.`;

  // Generate actionable insight based on signal types
  if (signalA === 'pr_size' && signalB === 'incident_count') {
    if (correlation > 0.4) {
      return `Large PRs are ${strength} correlated with more incidents. Consider breaking down PRs into smaller, focused changes to reduce risk.`;
    }
  }
  
  if (signalA === 'review_duration' && signalB === 'failed_build_rate') {
    if (correlation < -0.3) {
      return `Longer code reviews correlate with fewer build failures. Encouraging thorough reviews may improve build stability.`;
    } else if (correlation > 0.3) {
      return `Longer reviews correlate with more build failures. Complex changes may need additional testing before review.`;
    }
  }

  if (signalA === 'test_coverage' && signalB === 'incident_count') {
    if (correlation < -0.3) {
      return `Higher test coverage ${strength} correlates with fewer incidents. Investing in testing may reduce production issues.`;
    }
  }

  if (signalA === 'pr_size' && signalB === 'failed_build_rate') {
    if (correlation > 0.3) {
      return `Large PRs tend to have more build failures. Smaller, focused changes may improve build success rate.`;
    }
  }

  if (signalA === 'files_changed' && signalB === 'incident_count') {
    if (correlation > 0.3) {
      return `Changes spanning many files ${strength} correlate with more incidents. Consider modular changes.`;
    }
  }

  return `When ${signalA} ${direction}, ${signalB} tends to ${correlation > 0 ? 'increase' : 'decrease'} (r=${correlation.toFixed(2)}).`;
}

function getWeekKey(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function groupByWeek(data, getDate) {
  const weeks = new Map();
  
  for (const item of data) {
    const date = getDate(item);
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString();
    
    if (!weeks.has(key)) {
      weeks.set(key, { date: weekStart, items: [] });
    }
    weeks.get(key).items.push(item);
  }
  
  return Array.from(weeks.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

async function fetchSignalData(tenantId, signal, periodDays = 30) {
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
      const weeklyData = groupByWeek(data, d => d.startedAt);
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
      return data.map(d => ({ date: d.startedAt, value: d.testCoverage || 0 }));
    }

    case 'deployment_frequency': {
      const data = await prisma.buildData.findMany({
        where: { tenantId, startedAt: { gte: startDate }, status: 'success' },
        select: { startedAt: true },
        orderBy: { startedAt: 'asc' },
      });
      const weeklyData = groupByWeek(data, d => d.startedAt);
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
      const weeklyData = groupByWeek(data, d => d.createdAt);
      return weeklyData.map(week => ({ date: week.date, value: week.items.length }));
    }

    default:
      return [];
  }
}

function alignSignals(dataA, dataB) {
  const weekMapA = new Map();
  const weekMapB = new Map();

  for (const d of dataA) {
    const weekKey = getWeekKey(d.date);
    weekMapA.set(weekKey, (weekMapA.get(weekKey) || 0) + d.value);
  }
  
  for (const d of dataB) {
    const weekKey = getWeekKey(d.date);
    weekMapB.set(weekKey, (weekMapB.get(weekKey) || 0) + d.value);
  }

  const commonWeeks = Array.from(weekMapA.keys()).filter(k => weekMapB.has(k));
  
  const valuesA = commonWeeks.map(k => weekMapA.get(k));
  const valuesB = commonWeeks.map(k => weekMapB.get(k));

  return { valuesA, valuesB };
}

async function calculateAndSaveCorrelations() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }
  
  console.log('Calculating correlations for tenant:', tenant.name);
  
  const periodDays = 30;
  const signalPairs = [
    ['pr_size', 'incident_count'],
    ['pr_size', 'failed_build_rate'],
    ['review_duration', 'incident_count'],
    ['review_duration', 'failed_build_rate'],
    ['test_coverage', 'incident_count'],
    ['deployment_frequency', 'incident_count'],
    ['failed_build_rate', 'incident_count'],
    ['files_changed', 'incident_count'],
  ];

  const results = [];

  for (const [signalA, signalB] of signalPairs) {
    try {
      const dataA = await fetchSignalData(tenant.id, signalA, periodDays);
      const dataB = await fetchSignalData(tenant.id, signalB, periodDays);

      console.log(`  ${signalA} data points: ${dataA.length}, ${signalB} data points: ${dataB.length}`);
      
      if (dataA.length < 3 || dataB.length < 3) {
        console.log(`    ⚠️ Skipping - not enough data`);
        continue;
      }

      const { valuesA, valuesB } = alignSignals(dataA, dataB);
      
      console.log(`    Aligned weeks: ${valuesA.length}`);
      
      if (valuesA.length < 3) {
        console.log(`    ⚠️ Skipping - not enough aligned weeks`);
        continue;
      }

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
      
      console.log(`    ✅ r=${correlation.toFixed(3)} (${strength})`);
    } catch (error) {
      console.error(`Error for ${signalA}-${signalB}:`, error.message);
    }
  }

  // Save to database
  console.log('\nSaving to database...');
  for (const result of results) {
    await prisma.riskCorrelation.upsert({
      where: {
        tenantId_signalA_signalB: {
          tenantId: tenant.id,
          signalA: result.signalA,
          signalB: result.signalB,
        },
      },
      create: {
        tenantId: tenant.id,
        signalA: result.signalA,
        signalB: result.signalB,
        correlation: result.correlation,
        strength: result.strength,
        sampleSize: result.sampleSize,
        periodDays,
        insight: result.insight,
      },
      update: {
        correlation: result.correlation,
        strength: result.strength,
        sampleSize: result.sampleSize,
        periodDays,
        insight: result.insight,
        calculatedAt: new Date(),
      },
    });
  }
  
  console.log(`\n✅ Saved ${results.length} correlations to database!`);
  
  // Show results
  console.log('\n=== Correlation Results ===');
  for (const r of results.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))) {
    console.log(`${r.signalA} ↔ ${r.signalB}: r=${r.correlation} (${r.strength})`);
    console.log(`  Insight: ${r.insight}`);
  }
  
  await prisma.$disconnect();
}

calculateAndSaveCorrelations().catch(console.error);
