const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple Pearson correlation calculation
function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n < 3) return null;
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
  const sumY2 = y.reduce((acc, yi) => acc + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return null;
  return numerator / denominator;
}

function getStrength(coefficient) {
  const absCoef = Math.abs(coefficient);
  if (absCoef >= 0.7) return 'STRONG';
  if (absCoef >= 0.4) return 'MODERATE';
  return 'WEAK';
}

async function testCorrelation() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant');
    return;
  }
  
  console.log('Testing correlation for tenant:', tenant.name);
  console.log('');
  
  // Get PR data grouped by week
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  
  const prs = await prisma.pullRequestData.findMany({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: fourWeeksAgo }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  const builds = await prisma.buildData.findMany({
    where: {
      tenantId: tenant.id,
      startedAt: { gte: fourWeeksAgo }
    },
    orderBy: { startedAt: 'asc' }
  });
  
  const risks = await prisma.risk.findMany({
    where: {
      tenantId: tenant.id,
      createdAt: { gte: fourWeeksAgo }
    }
  });
  
  console.log('=== Raw Data ===');
  console.log(`PRs in last 28 days: ${prs.length}`);
  console.log(`Builds in last 28 days: ${builds.length}`);
  console.log(`Risks in last 28 days: ${risks.length}`);
  console.log('');
  
  // Calculate weekly aggregates
  const weeks = {};
  
  for (const pr of prs) {
    const week = getWeek(pr.mergedAt || pr.createdAt);
    if (!weeks[week]) weeks[week] = { prSize: 0, prCount: 0, reviewTime: 0, incidents: 0, builds: 0, failedBuilds: 0 };
    weeks[week].prSize += (pr.linesAdded || 0) + (pr.linesDeleted || 0);
    weeks[week].prCount++;
    weeks[week].reviewTime += pr.reviewDurationHrs || 0;
  }
  
  for (const build of builds) {
    const week = getWeek(build.startedAt);
    if (!weeks[week]) weeks[week] = { prSize: 0, prCount: 0, reviewTime: 0, incidents: 0, builds: 0, failedBuilds: 0 };
    weeks[week].builds++;
    if (build.status === 'failure') weeks[week].failedBuilds++;
  }
  
  for (const risk of risks) {
    if (risk.severity === 'CRITICAL' || risk.severity === 'HIGH') {
      const week = getWeek(risk.createdAt);
      if (!weeks[week]) weeks[week] = { prSize: 0, prCount: 0, reviewTime: 0, incidents: 0, builds: 0, failedBuilds: 0 };
      weeks[week].incidents++;
    }
  }
  
  console.log('=== Weekly Aggregates ===');
  for (const [week, data] of Object.entries(weeks)) {
    console.log(`Week ${week}: PRSize=${data.prSize}, PRCount=${data.prCount}, ReviewTime=${data.reviewTime}h, Incidents=${data.incidents}, Builds=${data.builds}, Failed=${data.failedBuilds}`);
  }
  console.log('');
  
  // Calculate correlations
  const weekKeys = Object.keys(weeks).sort();
  if (weekKeys.length < 3) {
    console.log('❌ Need at least 3 weeks of data for correlation');
    return;
  }
  
  const prSizes = weekKeys.map(w => weeks[w].prSize);
  const incidents = weekKeys.map(w => weeks[w].incidents);
  const reviewTimes = weekKeys.map(w => weeks[w].reviewTime);
  const failRates = weekKeys.map(w => weeks[w].builds > 0 ? weeks[w].failedBuilds / weeks[w].builds : 0);
  
  console.log('=== Correlation Results ===');
  
  // PR Size vs Incidents
  const prSizeIncidents = pearsonCorrelation(prSizes, incidents);
  if (prSizeIncidents !== null) {
    console.log(`PR Size ↔ Incidents: r=${prSizeIncidents.toFixed(3)} (${getStrength(prSizeIncidents)})`);
    console.log(`  → ${prSizeIncidents > 0 ? 'Larger PRs correlate with MORE incidents' : 'Larger PRs correlate with FEWER incidents'}`);
  }
  
  // Review Duration vs Failed Builds
  const reviewFail = pearsonCorrelation(reviewTimes, failRates);
  if (reviewFail !== null) {
    console.log(`Review Duration ↔ Build Failures: r=${reviewFail.toFixed(3)} (${getStrength(reviewFail)})`);
    console.log(`  → ${reviewFail > 0 ? 'Longer reviews correlate with MORE failures' : 'Longer reviews correlate with FEWER failures'}`);
  }
  
  await prisma.$disconnect();
}

function getWeek(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return `${d.getFullYear()}-W${Math.floor(diff / oneWeek) + 1}`;
}

testCorrelation().catch(console.error);
