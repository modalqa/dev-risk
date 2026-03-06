import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// POST /api/settings/integrations/git/sync - Sync git data
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await prisma.gitIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!integration) {
      return NextResponse.json({ error: 'No git integration found' }, { status: 404 });
    }

    // Update status to syncing
    await prisma.gitIntegration.update({
      where: { id: integration.id },
      data: { syncStatus: 'SYNCING', syncError: null },
    });

    // Create sync log
    const syncLog = await prisma.gitSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType: 'pull_requests',
        status: 'SYNCING',
      },
    });

    try {
      // Fetch pull requests from GitHub
      let recordsSynced = 0;

      if (integration.provider === 'GITHUB') {
        const pullRequests = await fetchGitHubPullRequests(
          integration.repoOwner,
          integration.repoName,
          integration.accessToken
        );

        // Save to database
        for (const pr of pullRequests) {
          await prisma.pullRequestData.upsert({
            where: {
              tenantId_externalId: {
                tenantId: user.tenantId,
                externalId: String(pr.number),
              },
            },
            create: {
              tenantId: user.tenantId,
              externalId: String(pr.number),
              title: pr.title,
              author: pr.user?.login || 'unknown',
              state: pr.state,
              linesAdded: pr.additions || 0,
              linesDeleted: pr.deletions || 0,
              filesChanged: pr.changed_files || 0,
              reviewCount: 0, // Will be fetched separately
              reviewDurationHrs: calculateReviewDuration(pr),
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
              createdAt: new Date(pr.created_at),
            },
            update: {
              title: pr.title,
              state: pr.state,
              linesAdded: pr.additions || 0,
              linesDeleted: pr.deletions || 0,
              filesChanged: pr.changed_files || 0,
              mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
            },
          });
          recordsSynced++;
        }
      }

      // Update sync log
      await prisma.gitSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          recordsFound: recordsSynced,
          recordsSynced,
          completedAt: new Date(),
        },
      });

      // Update integration status
      await prisma.gitIntegration.update({
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
      await prisma.gitSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          errorMessage,
          completedAt: new Date(),
        },
      });

      // Update integration status
      await prisma.gitIntegration.update({
        where: { id: integration.id },
        data: {
          syncStatus: 'FAILED',
          syncError: errorMessage,
        },
      });

      throw syncError;
    }
  } catch (error) {
    console.error('Error syncing git data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

// Fetch pull requests from GitHub API
async function fetchGitHubPullRequests(owner: string, repo: string, token: string) {
  const allPRs: any[] = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 3; // Limit to recent PRs

  while (page <= maxPages) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=${perPage}&page=${page}`,
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

    const prs = await res.json();
    if (prs.length === 0) break;

    // Fetch detailed info for each PR (including additions/deletions)
    const detailedPRs = await Promise.all(
      prs.map(async (pr: any) => {
        const detailRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'DevRisk-AI',
            },
          }
        );
        if (detailRes.ok) {
          return detailRes.json();
        }
        return pr;
      })
    );

    allPRs.push(...detailedPRs);
    page++;
  }

  return allPRs;
}

// Calculate review duration in hours
function calculateReviewDuration(pr: any): number | null {
  if (!pr.created_at) return null;

  const createdAt = new Date(pr.created_at);
  const endTime = pr.merged_at
    ? new Date(pr.merged_at)
    : pr.closed_at
    ? new Date(pr.closed_at)
    : new Date();

  const durationMs = endTime.getTime() - createdAt.getTime();
  const durationHrs = durationMs / (1000 * 60 * 60);

  return Math.round(durationHrs * 10) / 10; // Round to 1 decimal
}
