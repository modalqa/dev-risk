const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simple Linear Regression
function linearRegression(x, y) {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, r2: 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept, r2 };
}

function standardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

function getRiskLevel(riskIndex) {
  if (riskIndex >= 75) return 'CRITICAL';
  if (riskIndex >= 50) return 'HIGH';
  if (riskIndex >= 25) return 'MEDIUM';
  return 'LOW';
}

async function testPrediction() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }

  console.log('Testing Predictive Risk Engine for tenant:', tenant.name);
  console.log('');

  // Get historical releases
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12 weeks

  const releases = await prisma.release.findMany({
    where: {
      tenantId: tenant.id,
      deploymentDate: { gte: startDate },
    },
    orderBy: { deploymentDate: 'asc' },
  });

  console.log('=== Historical Data ===');
  console.log(`Found ${releases.length} releases in past 12 weeks`);
  console.log('');

  if (releases.length < 3) {
    console.log('❌ Insufficient data for prediction (need at least 3 data points)');
    return;
  }

  // Extract risk indices
  const riskIndices = releases.map(r => r.releaseRiskIndex);
  const dates = releases.map(r => r.deploymentDate);

  console.log('Risk Index History:');
  releases.forEach((r, i) => {
    console.log(`  ${r.version}: ${r.releaseRiskIndex.toFixed(1)} (${r.deploymentDate.toISOString().split('T')[0]})`);
  });
  console.log('');

  // Calculate trend
  const x = riskIndices.map((_, i) => i);
  const { slope, intercept, r2 } = linearRegression(x, riskIndices);

  let trend = 'STABLE';
  if (slope > 1) trend = 'WORSENING';
  else if (slope < -1) trend = 'IMPROVING';

  console.log('=== Trend Analysis ===');
  console.log(`Current Trend: ${trend}`);
  console.log(`Slope: ${slope.toFixed(3)} points/release`);
  console.log(`R²: ${r2.toFixed(3)} (model fit)`);
  console.log('');

  // Generate 4-week forecast
  console.log('=== 4-Week Forecast ===');
  const stdDev = standardDeviation(riskIndices);
  const currentRisk = riskIndices[riskIndices.length - 1];

  for (let week = 1; week <= 4; week++) {
    const predicted = slope * (riskIndices.length + week - 1) + intercept;
    const clamped = Math.max(0, Math.min(100, predicted));
    const uncertainty = stdDev * (1 + week * 0.15) * 1.96;
    const lower = Math.max(0, clamped - uncertainty);
    const upper = Math.min(100, clamped + uncertainty);
    const level = getRiskLevel(clamped);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + week * 7);

    console.log(`Week ${week} (${futureDate.toISOString().split('T')[0]}):`);
    console.log(`  Predicted Risk: ${clamped.toFixed(1)} [${lower.toFixed(1)} - ${upper.toFixed(1)}]`);
    console.log(`  Risk Level: ${level}`);
  }

  console.log('');
  console.log('=== Insights ===');
  if (trend === 'WORSENING') {
    console.log(`⚠️  Risk is trending upward at ~${slope.toFixed(1)} points per release.`);
  } else if (trend === 'IMPROVING') {
    console.log(`✅ Risk is trending downward at ~${Math.abs(slope).toFixed(1)} points per release.`);
  } else {
    console.log('📊 Risk has been relatively stable.');
  }

  if (currentRisk > 50) {
    console.log('🔴 Current risk is HIGH. Recommend stabilization sprint.');
  }

  await prisma.$disconnect();
}

testPrediction().catch(console.error);
