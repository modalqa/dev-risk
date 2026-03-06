import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ========================
  // SUPER ADMIN
  // ========================
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.superAdmin.upsert({
    where: { email: 'admin@devrisk.ai' },
    update: {},
    create: {
      email: 'admin@devrisk.ai',
      passwordHash: superAdminPassword,
      name: 'DevRisk Super Admin',
    },
  });
  console.log('✅ SuperAdmin created:', superAdmin.email);

  // ========================
  // TENANT 1: Acme Corp
  // ========================
  const acmeTenant = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Tenant created:', acmeTenant.name);

  const ownerPassword = await bcrypt.hash('password123', 12);
  const acmeOwner = await prisma.user.upsert({
    where: { email_tenantId: { email: 'owner@acme.com', tenantId: acmeTenant.id } },
    update: {},
    create: {
      email: 'owner@acme.com',
      passwordHash: ownerPassword,
      name: 'John Doe (Owner)',
      role: 'OWNER',
      tenantId: acmeTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@acme.com', tenantId: acmeTenant.id } },
    update: {},
    create: {
      email: 'admin@acme.com',
      passwordHash: ownerPassword,
      name: 'Jane Smith (Admin)',
      role: 'ADMIN',
      tenantId: acmeTenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'viewer@acme.com', tenantId: acmeTenant.id } },
    update: {},
    create: {
      email: 'viewer@acme.com',
      passwordHash: ownerPassword,
      name: 'Bob Wilson (Viewer)',
      role: 'VIEWER',
      tenantId: acmeTenant.id,
    },
  });
  console.log('✅ Acme users created');

  // ========================
  // TENANT 2: Startup XYZ
  // ========================
  const startupTenant = await prisma.tenant.upsert({
    where: { slug: 'startup-xyz' },
    update: {},
    create: {
      name: 'Startup XYZ',
      slug: 'startup-xyz',
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email_tenantId: { email: 'cto@startup.xyz', tenantId: startupTenant.id } },
    update: {},
    create: {
      email: 'cto@startup.xyz',
      passwordHash: ownerPassword,
      name: 'Alex Chen (CTO)',
      role: 'OWNER',
      tenantId: startupTenant.id,
    },
  });
  console.log('✅ Startup XYZ tenant created');

  // ========================
  // ACME: RELEASES
  // ========================
  const now = new Date();
  const release1 = await prisma.release.upsert({
    where: { version_tenantId: { version: 'v2.3.0', tenantId: acmeTenant.id } },
    update: {},
    create: {
      version: 'v2.3.0',
      description: 'Checkout flow redesign + payment improvements',
      engineeringScore: 0.52,
      userJourneyScore: 0.48,
      releaseRiskIndex: 71.2,
      deploymentDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: 'DEPLOYED',
      prSize: 2400,
      reviewDurationHours: 68,
      failedBuildRate: 0.25,
      testCoverage: 54,
      deploymentsPerWeek: 8,
      reopenedIssues: 12,
      tenantId: acmeTenant.id,
    },
  });

  const release2 = await prisma.release.upsert({
    where: { version_tenantId: { version: 'v2.4.0', tenantId: acmeTenant.id } },
    update: {},
    create: {
      version: 'v2.4.0',
      description: 'Mobile performance optimization + auth refactor',
      engineeringScore: 0.68,
      userJourneyScore: 0.72,
      releaseRiskIndex: 44.8,
      deploymentDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      prSize: 1100,
      reviewDurationHours: 24,
      failedBuildRate: 0.08,
      testCoverage: 71,
      deploymentsPerWeek: 5,
      reopenedIssues: 4,
      tenantId: acmeTenant.id,
    },
  });

  const release3 = await prisma.release.upsert({
    where: { version_tenantId: { version: 'v2.5.0', tenantId: acmeTenant.id } },
    update: {},
    create: {
      version: 'v2.5.0',
      description: 'AI recommendation engine + dashboard v2',
      engineeringScore: 0.31,
      userJourneyScore: 0.38,
      releaseRiskIndex: 87.6,
      deploymentDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      prSize: 4800,
      reviewDurationHours: 96,
      failedBuildRate: 0.42,
      testCoverage: 38,
      deploymentsPerWeek: 12,
      reopenedIssues: 22,
      tenantId: acmeTenant.id,
    },
  });
  console.log('✅ Releases created');

  // ========================
  // ACME: RISKS
  // ========================
  const risks = [
    {
      title: 'Test Coverage Below Threshold (Checkout Module)',
      description: 'Test coverage on the checkout module dropped to 38%, far below the 70% standard. Increases regression risk on the payment flow.',
      category: 'ENGINEERING' as const,
      severity: 'CRITICAL' as const,
      score: 92,
      releaseId: release1.id,
    },
    {
      title: 'High PR Size - Auth Refactor',
      description: 'PR size reached 4,200 lines of code without proper review. High complexity increases the risk of hidden bugs.',
      category: 'RELEASE_PROCESS' as const,
      severity: 'HIGH' as const,
      score: 78,
      releaseId: release1.id,
    },
    {
      title: 'Elevated Failed Build Rate',
      description: 'Failed build rate reached 42% in the last 2 sprints. Indicates an unstable codebase.',
      category: 'ENGINEERING' as const,
      severity: 'HIGH' as const,
      score: 74,
      releaseId: release3.id,
    },
    {
      title: 'Checkout Drop-off Rate Spike',
      description: 'Drop-off rate on checkout flow increased by 28% since release v2.3.0. Significant potential revenue impact.',
      category: 'USER_JOURNEY' as const,
      severity: 'CRITICAL' as const,
      score: 89,
      releaseId: release1.id,
    },
    {
      title: 'Payment Gateway Timeout Incidents',
      description: '3 payment gateway timeout incidents recorded in the last 7 days. Average incident duration of 18 minutes.',
      category: 'PERFORMANCE' as const,
      severity: 'HIGH' as const,
      score: 81,
      releaseId: release1.id,
    },
    {
      title: 'Rapid Deployment Frequency',
      description: 'Deployment frequency reached 12x/week, exceeding the recommended threshold of 7x/week. Stability risk is increasing.',
      category: 'RELEASE_PROCESS' as const,
      severity: 'MEDIUM' as const,
      score: 55,
      releaseId: release3.id,
    },
    {
      title: 'Signup Flow Regression Detected',
      description: 'Regression on signup flow causing 12% of users to fail onboarding completion. Requires immediate hotfix.',
      category: 'USER_JOURNEY' as const,
      severity: 'HIGH' as const,
      score: 76,
      releaseId: release2.id,
    },
    {
      title: 'JWT Token Expiry Not Handling Edge Cases',
      description: 'Edge case in token refresh causing session loss for mobile users. Medium-level security concern.',
      category: 'SECURITY' as const,
      severity: 'MEDIUM' as const,
      score: 48,
      releaseId: release2.id,
    },
    {
      title: 'Database Query Performance Degradation',
      description: 'P95 query time increased by 340% on the /api/products endpoint after the latest schema migration.',
      category: 'PERFORMANCE' as const,
      severity: 'HIGH' as const,
      score: 72,
      releaseId: release3.id,
    },
    {
      title: 'Low Review Duration on Critical Module',
      description: 'Average review duration on the payment module is only 2.3 hours. Insufficient review time for critical changes.',
      category: 'ENGINEERING' as const,
      severity: 'MEDIUM' as const,
      score: 52,
      releaseId: release2.id,
    },
  ];

  for (const riskData of risks) {
    await prisma.risk.create({
      data: {
        ...riskData,
        tenantId: acmeTenant.id,
        status: Math.random() > 0.6 ? 'OPEN' : Math.random() > 0.5 ? 'IN_PROGRESS' : 'MITIGATED',
      },
    });
  }
  console.log('✅ Risks created');

  // ========================
  // USER JOURNEY FLOWS
  // ========================
  const flows = [
    { name: 'Signup & Onboarding', dropoffRate: 0.18, incidentCount: 5, stabilityScore: 0.62 },
    { name: 'Product Discovery', dropoffRate: 0.09, incidentCount: 1, stabilityScore: 0.81 },
    { name: 'Add to Cart', dropoffRate: 0.14, incidentCount: 2, stabilityScore: 0.73 },
    { name: 'Checkout Flow', dropoffRate: 0.34, incidentCount: 8, stabilityScore: 0.33 },
    { name: 'Payment Processing', dropoffRate: 0.28, incidentCount: 6, stabilityScore: 0.42 },
    { name: 'Order Confirmation', dropoffRate: 0.05, incidentCount: 0, stabilityScore: 0.92 },
    { name: 'Account Dashboard', dropoffRate: 0.11, incidentCount: 1, stabilityScore: 0.77 },
    { name: 'Customer Support Flow', dropoffRate: 0.22, incidentCount: 3, stabilityScore: 0.58 },
  ];

  for (const flow of flows) {
    await prisma.userJourneyFlow.create({
      data: { ...flow, tenantId: acmeTenant.id },
    });
  }
  console.log('✅ User Journey Flows created');

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Login Credentials:');
  console.log('  SuperAdmin: admin@devrisk.ai / superadmin123 → /superadmin/login');
  console.log('  Owner:      owner@acme.com / password123    → /login');
  console.log('  Admin:      admin@acme.com / password123    → /login');
  console.log('  Viewer:     viewer@acme.com / password123   → /login');

  // ========================
  // AI PROVIDERS
  // ========================
  console.log('🤖 Creating AI Providers...');

  const openaiProvider = await prisma.aiProvider.upsert({
    where: { id: 'openai-default' },
    update: {},
    create: {
      id: 'openai-default',
      name: 'openai',
      displayName: 'OpenAI GPT-4',
      type: 'OPENAI',
      isActive: true,
      model: 'gpt-4o',
      apiKey: null, // Will be set via admin UI
    },
  });

  const geminiProvider = await prisma.aiProvider.upsert({
    where: { id: 'gemini-default' },
    update: {},
    create: {
      id: 'gemini-default',
      name: 'gemini',
      displayName: 'Google Gemini Pro',
      type: 'GEMINI',
      isActive: false,
      model: 'gemini-1.5-pro-latest',
      apiKey: null, // Will be set via admin UI
    },
  });

  const ollamaProvider = await prisma.aiProvider.upsert({
    where: { id: 'ollama-default' },
    update: {},
    create: {
      id: 'ollama-default',
      name: 'ollama',
      displayName: 'Ollama (Local)',
      type: 'OLLAMA',
      isActive: false,
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2',
      apiKey: null, // Ollama doesn't need API key by default
    },
  });

  console.log('✅ AI Providers created:');
  console.log('  - OpenAI GPT-4 (Active)');
  console.log('  - Google Gemini Pro (Inactive)');
  console.log('  - Ollama Local (Inactive)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
