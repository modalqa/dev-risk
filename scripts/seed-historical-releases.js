const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHistoricalData() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }

  console.log('Seeding historical release data for forecasting...');

  // Create releases over past 12 weeks with varying metrics
  const releases = [];
  const baseDate = new Date();
  
  for (let week = 12; week >= 1; week--) {
    const deploymentDate = new Date(baseDate);
    deploymentDate.setDate(deploymentDate.getDate() - (week * 7));
    
    // Simulate gradual risk increase with some noise
    const trendFactor = (12 - week) / 12; // 0 to 1 as we approach present
    const noise = (Math.random() - 0.5) * 20;
    
    const engineeringScore = Math.max(0.3, Math.min(0.9, 0.75 - (trendFactor * 0.15) + (noise * 0.01)));
    const userJourneyScore = Math.max(30, Math.min(90, 70 - (trendFactor * 10) + (noise * 0.5)));
    const releaseRiskIndex = Math.max(10, Math.min(85, 30 + (trendFactor * 25) + noise));
    
    releases.push({
      version: `v2.${12 - week}.0`,
      description: `Release week ${12 - week}`,
      engineeringScore,
      userJourneyScore,
      releaseRiskIndex,
      deploymentDate,
      status: 'DEPLOYED',
      prSize: Math.floor(500 + (trendFactor * 800) + (Math.random() * 300)),
      reviewDurationHours: Math.floor(4 + (Math.random() * 20)),
      failedBuildRate: Math.min(0.4, 0.05 + (trendFactor * 0.15) + (Math.random() * 0.1)),
      testCoverage: Math.max(50, 80 - (trendFactor * 20) + (Math.random() * 10)),
      deploymentsPerWeek: Math.floor(2 + (trendFactor * 3) + (Math.random() * 2)),
      reopenedIssues: Math.floor(trendFactor * 5 + (Math.random() * 3)),
      tenantId: tenant.id,
    });
  }

  // Clear existing releases for clean test
  // await prisma.release.deleteMany({ where: { tenantId: tenant.id } });

  for (const release of releases) {
    await prisma.release.upsert({
      where: {
        version_tenantId: {
          version: release.version,
          tenantId: tenant.id,
        },
      },
      create: release,
      update: release,
    });
    console.log(`  ✅ Created/Updated: ${release.version} (Risk: ${release.releaseRiskIndex.toFixed(1)})`);
  }

  console.log(`\nTotal releases: ${await prisma.release.count({ where: { tenantId: tenant.id } })}`);
  
  // Show recent releases
  const recentReleases = await prisma.release.findMany({
    where: { tenantId: tenant.id },
    orderBy: { deploymentDate: 'desc' },
    take: 5,
  });
  
  console.log('\nRecent releases:');
  for (const r of recentReleases) {
    console.log(`  ${r.version}: Risk=${r.releaseRiskIndex.toFixed(1)}, Eng=${(r.engineeringScore * 100).toFixed(0)}%, Date=${r.deploymentDate.toISOString().split('T')[0]}`);
  }

  await prisma.$disconnect();
  console.log('\nDone! Go to Dashboard to see the Risk Forecast.');
}

seedHistoricalData().catch(console.error);
