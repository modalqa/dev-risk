import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// POST /api/settings/integrations/git - Create git integration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Owner/Admin can manage integrations
    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, repoOwner, repoName, accessToken } = body;

    if (!provider || !repoOwner || !repoName || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.gitIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Git integration already exists. Use PUT to update.' }, { status: 409 });
    }

    // Test the connection before saving
    const isValid = await testGitConnection(provider, repoOwner, repoName, accessToken);
    if (!isValid.success) {
      return NextResponse.json({ error: isValid.error || 'Failed to connect to repository' }, { status: 400 });
    }

    const integration = await prisma.gitIntegration.create({
      data: {
        tenantId: user.tenantId,
        provider,
        repoOwner,
        repoName,
        accessToken, // In production, encrypt this!
        syncStatus: 'PENDING',
      },
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
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_CREATED',
      'GitIntegration',
      integration.id,
      { provider, repoOwner, repoName }
    );

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Error creating git integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/integrations/git - Update git integration
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, repoOwner, repoName, accessToken } = body;

    const existing = await prisma.gitIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No git integration found' }, { status: 404 });
    }

    // Test the connection if token changed
    if (accessToken) {
      const isValid = await testGitConnection(provider || existing.provider, repoOwner || existing.repoOwner, repoName || existing.repoName, accessToken);
      if (!isValid.success) {
        return NextResponse.json({ error: isValid.error || 'Failed to connect to repository' }, { status: 400 });
      }
    }

    const integration = await prisma.gitIntegration.update({
      where: { tenantId: user.tenantId },
      data: {
        ...(provider && { provider }),
        ...(repoOwner && { repoOwner }),
        ...(repoName && { repoName }),
        ...(accessToken && { accessToken }),
        syncStatus: 'PENDING',
      },
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
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_UPDATED',
      'GitIntegration',
      integration.id,
      { provider: integration.provider, repoOwner: integration.repoOwner, repoName: integration.repoName }
    );

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error updating git integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/integrations/git - Delete git integration
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.gitIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No git integration found' }, { status: 404 });
    }

    await prisma.gitIntegration.delete({
      where: { tenantId: user.tenantId },
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_DELETED',
      'GitIntegration',
      existing.id,
      { provider: existing.provider, repoOwner: existing.repoOwner, repoName: existing.repoName }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting git integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to test git connection
async function testGitConnection(
  provider: string,
  repoOwner: string,
  repoName: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (provider === 'GITHUB') {
      const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'DevRisk-AI',
        },
      });

      if (res.status === 401) {
        return { success: false, error: 'Invalid access token' };
      }
      if (res.status === 404) {
        return { success: false, error: 'Repository not found or no access' };
      }
      if (!res.ok) {
        return { success: false, error: `GitHub API error: ${res.status}` };
      }

      return { success: true };
    }

    if (provider === 'GITLAB') {
      const encodedPath = encodeURIComponent(`${repoOwner}/${repoName}`);
      const res = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}`, {
        headers: {
          'PRIVATE-TOKEN': accessToken,
        },
      });

      if (res.status === 401) {
        return { success: false, error: 'Invalid access token' };
      }
      if (res.status === 404) {
        return { success: false, error: 'Project not found or no access' };
      }
      if (!res.ok) {
        return { success: false, error: `GitLab API error: ${res.status}` };
      }

      return { success: true };
    }

    // Bitbucket and others - basic validation for now
    return { success: true };
  } catch (error) {
    console.error('Git connection test failed:', error);
    return { success: false, error: 'Connection failed. Check your network.' };
  }
}
