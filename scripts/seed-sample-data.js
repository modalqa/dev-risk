const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSampleData() {
  // Get tenant ID from existing data
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('No tenant found');
    return;
  }
  
  console.log('Seeding sample PR and Build data for tenant:', tenant.name);
  
  // Add sample PR data over past 4 weeks
  const prSamples = [
    { externalId: '100', title: 'feat: add user authentication', author: 'dev1', state: 'merged', linesAdded: 450, linesDeleted: 120, filesChanged: 12, reviewDurationHrs: 8, mergedAt: new Date('2026-02-10') },
    { externalId: '101', title: 'fix: checkout validation bug', author: 'dev2', state: 'merged', linesAdded: 85, linesDeleted: 30, filesChanged: 3, reviewDurationHrs: 2, mergedAt: new Date('2026-02-12') },
    { externalId: '102', title: 'refactor: payment module', author: 'dev1', state: 'merged', linesAdded: 1200, linesDeleted: 800, filesChanged: 25, reviewDurationHrs: 24, mergedAt: new Date('2026-02-15') },
    { externalId: '103', title: 'feat: dashboard analytics', author: 'dev3', state: 'merged', linesAdded: 320, linesDeleted: 50, filesChanged: 8, reviewDurationHrs: 6, mergedAt: new Date('2026-02-18') },
    { externalId: '104', title: 'hotfix: login crash', author: 'dev2', state: 'merged', linesAdded: 25, linesDeleted: 10, filesChanged: 2, reviewDurationHrs: 1, mergedAt: new Date('2026-02-20') },
    { externalId: '105', title: 'feat: notification system', author: 'dev1', state: 'merged', linesAdded: 890, linesDeleted: 200, filesChanged: 18, reviewDurationHrs: 16, mergedAt: new Date('2026-02-22') },
    { externalId: '106', title: 'fix: memory leak in worker', author: 'dev3', state: 'merged', linesAdded: 150, linesDeleted: 80, filesChanged: 5, reviewDurationHrs: 4, mergedAt: new Date('2026-02-25') },
    { externalId: '107', title: 'chore: upgrade dependencies', author: 'dev2', state: 'merged', linesAdded: 2500, linesDeleted: 2400, filesChanged: 3, reviewDurationHrs: 3, mergedAt: new Date('2026-02-28') },
    { externalId: '108', title: 'feat: user profile redesign', author: 'dev1', state: 'merged', linesAdded: 650, linesDeleted: 300, filesChanged: 15, reviewDurationHrs: 12, mergedAt: new Date('2026-03-02') },
    { externalId: '109', title: 'fix: API rate limiting', author: 'dev3', state: 'merged', linesAdded: 180, linesDeleted: 45, filesChanged: 6, reviewDurationHrs: 5, mergedAt: new Date('2026-03-04') },
  ];
  
  for (const pr of prSamples) {
    await prisma.pullRequestData.upsert({
      where: { tenantId_externalId: { tenantId: tenant.id, externalId: pr.externalId } },
      create: {
        tenantId: tenant.id,
        ...pr,
        createdAt: new Date(pr.mergedAt.getTime() - (pr.reviewDurationHrs * 60 * 60 * 1000)),
      },
      update: pr,
    });
  }
  console.log('✅ Added', prSamples.length, 'sample PRs');
  
  // Add sample build data
  const buildSamples = [
    { externalId: 'b100', branch: 'main', status: 'success', duration: 180, testCoverage: 72, startedAt: new Date('2026-02-10') },
    { externalId: 'b101', branch: 'main', status: 'success', duration: 195, testCoverage: 71, startedAt: new Date('2026-02-12') },
    { externalId: 'b102', branch: 'main', status: 'failure', duration: 45, testCoverage: null, startedAt: new Date('2026-02-14') },
    { externalId: 'b103', branch: 'main', status: 'success', duration: 210, testCoverage: 68, startedAt: new Date('2026-02-15') },
    { externalId: 'b104', branch: 'main', status: 'success', duration: 175, testCoverage: 70, startedAt: new Date('2026-02-18') },
    { externalId: 'b105', branch: 'main', status: 'failure', duration: 60, testCoverage: null, startedAt: new Date('2026-02-20') },
    { externalId: 'b106', branch: 'main', status: 'success', duration: 220, testCoverage: 65, startedAt: new Date('2026-02-22') },
    { externalId: 'b107', branch: 'main', status: 'success', duration: 185, testCoverage: 67, startedAt: new Date('2026-02-25') },
    { externalId: 'b108', branch: 'main', status: 'failure', duration: 55, testCoverage: null, startedAt: new Date('2026-02-27') },
    { externalId: 'b109', branch: 'main', status: 'success', duration: 200, testCoverage: 69, startedAt: new Date('2026-03-01') },
    { externalId: 'b110', branch: 'main', status: 'success', duration: 190, testCoverage: 71, startedAt: new Date('2026-03-03') },
    { externalId: 'b111', branch: 'main', status: 'success', duration: 205, testCoverage: 73, startedAt: new Date('2026-03-05') },
  ];
  
  for (const build of buildSamples) {
    await prisma.buildData.upsert({
      where: { tenantId_externalId: { tenantId: tenant.id, externalId: build.externalId } },
      create: { tenantId: tenant.id, ...build },
      update: build,
    });
  }
  console.log('✅ Added', buildSamples.length, 'sample builds');
  
  await prisma.$disconnect();
  console.log('Done! Now go to Dashboard and click Refresh on Correlations card.');
}

seedSampleData().catch(console.error);
