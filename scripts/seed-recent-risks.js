const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedRecentRisks() {
  const tenant = await prisma.tenant.findFirst();
  const releases = await prisma.release.findMany({ where: { tenantId: tenant.id }, take: 5 });
  
  if (!releases.length) {
    console.log('No releases found');
    return;
  }
  
  console.log('Adding sample risks with recent dates...');
  
  const riskSamples = [
    // Week of Feb 10
    { title: 'Database connection timeout', severity: 'HIGH', createdAt: new Date('2026-02-10') },
    // Week of Feb 17
    { title: 'Memory leak in service worker', severity: 'CRITICAL', createdAt: new Date('2026-02-18') },
    { title: 'API rate limit exceeded', severity: 'HIGH', createdAt: new Date('2026-02-19') },
    // Week of Feb 24
    { title: 'SSL certificate expiration', severity: 'HIGH', createdAt: new Date('2026-02-25') },
    { title: 'Payment gateway timeout', severity: 'CRITICAL', createdAt: new Date('2026-02-26') },
    { title: 'User session corruption', severity: 'HIGH', createdAt: new Date('2026-02-27') },
    // Week of Mar 3
    { title: 'CDN cache invalidation', severity: 'HIGH', createdAt: new Date('2026-03-03') },
    { title: 'Webhook delivery failure', severity: 'CRITICAL', createdAt: new Date('2026-03-04') },
    { title: 'Search index corruption', severity: 'HIGH', createdAt: new Date('2026-03-05') },
  ];
  
  for (const risk of riskSamples) {
    await prisma.risk.create({
      data: {
        tenantId: tenant.id,
        releaseId: releases[Math.floor(Math.random() * releases.length)].id,
        title: risk.title,
        description: `Sample risk: ${risk.title}`,
        severity: risk.severity,
        status: 'OPEN',
        category: 'ENGINEERING',
        score: risk.severity === 'CRITICAL' ? 90 : 75,
        createdAt: risk.createdAt,
      },
    });
    console.log(`  ✅ Added: ${risk.title} (${risk.severity}) - ${risk.createdAt.toISOString().split('T')[0]}`);
  }
  
  console.log(`\nTotal risks now: ${await prisma.risk.count({ where: { tenantId: tenant.id } })}`);
  await prisma.$disconnect();
}

seedRecentRisks().catch(console.error);
