import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/settings/integrations/cicd/sync - Sync CI/CD data
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.cICDIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!integration) {
      return NextResponse.json({ error: 'No CI/CD integration found' }, { status: 404 });
    }

    // Also need git integration for GitHub Actions
    const gitIntegration = await prisma.gitIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    // Update status to syncing
    await prisma.cICDIntegration.update({
      where: { id: integration.id },
      data: { syncStatus: 'SYNCING', syncError: null },
    });

    // Create sync log
    const syncLog = await prisma.cICDSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType: 'builds',
        status: 'SYNCING',
      },
    });

    try {
      let recordsSynced = 0;

      if (integration.provider === 'GITHUB_ACTIONS' && gitIntegration) {
        const workflows = await fetchGitHubActionsRuns(
          gitIntegration.repoOwner,
          gitIntegration.repoName,
          integration.accessToken || gitIntegration.accessToken
        );

        // Save to database
        for (const run of workflows) {
          await prisma.buildData.upsert({
            where: {
              tenantId_externalId: {
                tenantId: user.tenantId,
                externalId: String(run.id),
              },
            },
            create: {
              tenantId: user.tenantId,
              externalId: String(run.id),
              branch: run.head_branch,
              commitSha: run.head_sha,
              status: mapGitHubStatus(run.conclusion || run.status),
              duration: calculateDuration(run.created_at, run.updated_at),
              triggeredBy: run.triggering_actor?.login || run.actor?.login,
              startedAt: run.run_started_at ? new Date(run.run_started_at) : new Date(run.created_at),
              finishedAt: run.conclusion ? new Date(run.updated_at) : null,
            },
            update: {
              status: mapGitHubStatus(run.conclusion || run.status),
              duration: calculateDuration(run.created_at, run.updated_at),
              finishedAt: run.conclusion ? new Date(run.updated_at) : null,
            },
          });
          recordsSynced++;
        }
      }

      // Update sync log
      await prisma.cICDSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          recordsFound: recordsSynced,
          recordsSynced,
          completedAt: new Date(),
        },
      });

      // Update integration status
      await prisma.cICDIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'SUCCESS',
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      return NextResponse.json({
        success: true,
        recordsSynced,
      });
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';

      // Update sync log
      await prisma.cICDSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });

      // Update integration status
      await prisma.cICDIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'FAILED',
          syncError: errorMessage,
        },
      });

      throw syncError;
    }
  } catch (error) {
    console.error('Error syncing CICD data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// Fetch GitHub Actions workflow runs
async function fetchGitHubActionsRuns(owner: string, repo: string, token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'DevRisk-AI',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  return data.workflow_runs || [];
}

// Map GitHub Actions status to our status
function mapGitHubStatus(status: string | null): string {
  if (!status) return 'pending';
  
  switch (status.toLowerCase()) {
    case 'success':
      return 'success';
    case 'failure':
    case 'failed':
      return 'failure';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'in_progress':
    case 'queued':
    case 'pending':
      return 'pending';
    default:
      return status;
  }
}

// Calculate duration in seconds
function calculateDuration(startedAt: string, finishedAt: string): number | null {
  if (!startedAt || !finishedAt) return null;
  
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  
  return Math.round((end - start) / 1000);
}
