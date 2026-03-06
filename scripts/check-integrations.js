const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n========== DATABASE CHECK ==========\n');

  // 1. Check Git Integration
  const gitInt = await prisma.gitIntegration.findMany();
  console.log('=== Git Integrations ===');
  if (gitInt.length === 0) {
    console.log('❌ No Git integration found. Go to /settings/integrations to connect.');
  } else {
    gitInt.forEach(g => {
      console.log(`✅ ${g.provider}: ${g.repoOwner}/${g.repoName}`);
      console.log(`   Status: ${g.syncStatus}, Active: ${g.isActive}`);
      console.log(`   Last Sync: ${g.lastSyncAt || 'Never'}`);
      if (g.syncError) console.log(`   ⚠️ Error: ${g.syncError}`);
    });
  }

  // 2. Check Synced PR Data
  const prCount = await prisma.pullRequestData.count();
  console.log('\n=== Pull Request Data ===');
  console.log(`Total PRs synced: ${prCount}`);
  if (prCount > 0) {
    const prs = await prisma.pullRequestData.findMany({ 
      take: 3, 
      orderBy: { createdAt: 'desc' } 
    });
    console.log('Recent PRs:');
    prs.forEach(pr => {
      console.log(`  - #${pr.externalId}: ${pr.title.substring(0, 50)}... (${pr.state})`);
    });
  }

  // 3. Check CI/CD Integration
  const cicdInt = await prisma.cICDIntegration.findMany();
  console.log('\n=== CI/CD Integrations ===');
  if (cicdInt.length === 0) {
    console.log('❌ No CI/CD integration found.');
  } else {
    cicdInt.forEach(c => {
      console.log(`✅ ${c.provider}`);
      console.log(`   Status: ${c.syncStatus}, Active: ${c.isActive}`);
      console.log(`   Last Sync: ${c.lastSyncAt || 'Never'}`);
      if (c.syncError) console.log(`   ⚠️ Error: ${c.syncError}`);
    });
  }

  // 4. Check Build Data
  const buildCount = await prisma.buildData.count();
  console.log('\n=== Build Data ===');
  console.log(`Total builds synced: ${buildCount}`);

  // 5. Check Sync Logs
  const syncLogs = await prisma.gitSyncLog.findMany({ 
    orderBy: { startedAt: 'desc' }, 
    take: 5 
  });
  console.log('\n=== Recent Git Sync Logs ===');
  if (syncLogs.length === 0) {
    console.log('No sync logs yet. Click "Sync Now" on the integrations page.');
  } else {
    syncLogs.forEach(log => {
      console.log(`  ${log.startedAt.toISOString()} - ${log.syncType}: ${log.status}`);
      console.log(`    Records: ${log.recordsSynced}/${log.recordsFound}`);
      if (log.errorMessage) console.log(`    Error: ${log.errorMessage}`);
    });
  }

  // 6. Check Correlations
  const correlations = await prisma.riskCorrelation.findMany();
  console.log('\n=== Risk Correlations ===');
  if (correlations.length === 0) {
    console.log('No correlations calculated yet. Need synced data first.');
  } else {
    correlations.forEach(c => {
      console.log(`  ${c.signalA} ↔ ${c.signalB}: r=${c.correlation.toFixed(2)} (${c.strength})`);
    });
  }

  console.log('\n=====================================\n');
  await prisma.$disconnect();
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
