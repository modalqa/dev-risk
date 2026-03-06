import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/settings/integrations - Get all integrations for tenant
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [gitIntegration, cicdIntegration, prCount, buildCount] = await Promise.all([
      prisma.gitIntegration.findUnique({
        where: { tenantId: user.tenantId },
        select: {
          id: true,
          provider: true,
          repoOwner: true,
          repoName: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          syncError: true,
        },
      }),
      prisma.cICDIntegration.findUnique({
        where: { tenantId: user.tenantId },
        select: {
          id: true,
          provider: true,
          projectId: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          syncError: true,
        },
      }),
      prisma.pullRequestData.count({
        where: { tenantId: user.tenantId },
      }),
      prisma.buildData.count({
        where: { tenantId: user.tenantId },
      }),
    ]);

    // Count code reviews (PRs with review duration > 0)
    const codeReviewCount = await prisma.pullRequestData.count({
      where: { 
        tenantId: user.tenantId,
        reviewDurationHrs: { gt: 0 },
      },
    });

    // Count deployments (successful builds)
    const deploymentCount = await prisma.buildData.count({
      where: { 
        tenantId: user.tenantId,
        status: 'success',
      },
    });

    return NextResponse.json({
      git: gitIntegration,
      cicd: cicdIntegration,
      stats: {
        pullRequests: prCount,
        codeReviews: codeReviewCount,
        builds: buildCount,
        deployments: deploymentCount,
      },
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
