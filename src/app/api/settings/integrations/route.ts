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

    const [gitIntegration, cicdIntegration] = await Promise.all([
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
    ]);

    return NextResponse.json({
      git: gitIntegration,
      cicd: cicdIntegration,
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
