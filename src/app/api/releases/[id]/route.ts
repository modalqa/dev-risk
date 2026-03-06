import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { calculateEngineeringScore, calculateReleaseRiskIndex } from '@/lib/risk-engine';

// GET /api/releases/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const release = await prisma.release.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
      include: {
        risks: {
          orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!release) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...release,
      deploymentDate: release.deploymentDate.toISOString(),
      createdAt: release.createdAt.toISOString(),
      updatedAt: release.updatedAt.toISOString(),
      risks: release.risks.map((r: any) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT /api/releases/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.release.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();

    // Recalculate scores if signals changed
    const prSize             = body.prSize             ?? existing.prSize;
    const reviewDurationHours = body.reviewDurationHours ?? existing.reviewDurationHours;
    const failedBuildRate    = body.failedBuildRate    ?? existing.failedBuildRate;
    const testCoverage       = body.testCoverage       ?? existing.testCoverage;
    const deploymentsPerWeek = body.deploymentsPerWeek ?? existing.deploymentsPerWeek;
    const reopenedIssues     = body.reopenedIssues     ?? existing.reopenedIssues;

    const engScore = calculateEngineeringScore({
      testCoverage:        testCoverage       ?? 50,
      reviewDurationHours: reviewDurationHours ?? 24,
      failedBuildRate:     failedBuildRate    ?? 0.1,
      deploymentsPerWeek:  deploymentsPerWeek ?? 5,
      reopenedIssues:      reopenedIssues     ?? 2,
      prSize:              prSize             ?? 500,
    });

    const riskCount = await prisma.risk.count({ where: { releaseId: params.id } });
    const highRiskCount = await prisma.risk.count({
      where: { releaseId: params.id, severity: { in: ['HIGH', 'CRITICAL'] } },
    });
    const highRatio = riskCount > 0 ? highRiskCount / riskCount : 0;
    const riskIndex = calculateReleaseRiskIndex(engScore, highRatio);

    const release = await prisma.release.update({
      where: { id: params.id },
      data: {
        version:             body.version             ?? existing.version,
        description:         body.description         ?? existing.description,
        status:              body.status              ?? existing.status,
        deploymentDate:      body.deploymentDate ? new Date(body.deploymentDate) : existing.deploymentDate,
        prSize,
        reviewDurationHours,
        failedBuildRate,
        testCoverage,
        deploymentsPerWeek,
        reopenedIssues,
        engineeringScore:    engScore,
        userJourneyScore:    engScore * 0.9,
        releaseRiskIndex:    riskIndex,
      },
    });

    await createAuditLog(user.tenantId, 'UPDATE', 'Release', release.id, body);

    return NextResponse.json({
      ...release,
      deploymentDate: release.deploymentDate.toISOString(),
      createdAt: release.createdAt.toISOString(),
      updatedAt: release.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/releases/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.release.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.release.delete({ where: { id: params.id } });
    await createAuditLog(user.tenantId, 'DELETE', 'Release', params.id, {});

    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
