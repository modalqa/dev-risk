import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// POST /api/settings/integrations/cicd - Create CI/CD integration
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { provider, projectId, accessToken } = body;

    if (!provider || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already exists
    const existing = await prisma.cICDIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (existing) {
      return NextResponse.json({ error: 'CI/CD integration already exists. Use PUT to update.' }, { status: 409 });
    }

    const integration = await prisma.cICDIntegration.create({
      data: {
        tenantId: user.tenantId,
        provider,
        projectId: projectId || null,
        accessToken, // In production, encrypt this!
        syncStatus: 'PENDING',
      },
      select: {
        id: true,
        provider: true,
        projectId: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        syncError: true,
      },
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_CREATED',
      'CICDIntegration',
      integration.id,
      { provider, projectId }
    );

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    console.error('Error creating CICD integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/settings/integrations/cicd - Update CI/CD integration
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
    const { provider, projectId, accessToken } = body;

    const existing = await prisma.cICDIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No CI/CD integration found' }, { status: 404 });
    }

    const integration = await prisma.cICDIntegration.update({
      where: { tenantId: user.tenantId },
      data: {
        ...(provider && { provider }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(accessToken && { accessToken }),
        syncStatus: 'PENDING',
      },
      select: {
        id: true,
        provider: true,
        projectId: true,
        isActive: true,
        lastSyncAt: true,
        syncStatus: true,
        syncError: true,
      },
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_UPDATED',
      'CICDIntegration',
      integration.id,
      { provider: integration.provider, projectId: integration.projectId }
    );

    return NextResponse.json(integration);
  } catch (error) {
    console.error('Error updating CICD integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/settings/integrations/cicd - Delete CI/CD integration
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.cICDIntegration.findUnique({
      where: { tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No CI/CD integration found' }, { status: 404 });
    }

    await prisma.cICDIntegration.delete({
      where: { tenantId: user.tenantId },
    });

    await createAuditLog(
      user.tenantId,
      'INTEGRATION_DELETED',
      'CICDIntegration',
      existing.id,
      { provider: existing.provider, projectId: existing.projectId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting CICD integration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
