import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { aiProviderManager } from '@/lib/ai-provider';
import { calculateEngineeringScore, calculateReleaseRiskIndex } from '@/lib/risk-engine';
import { notifyReleaseCreated } from '@/lib/notification';

// GET /api/releases
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (status) where.status = status;

    const [releases, total] = await Promise.all([
      prisma.release.findMany({
        where,
        orderBy: { deploymentDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { risks: true } },
          risks: { select: { severity: true, status: true } },
        },
      }),
      prisma.release.count({ where }),
    ]);

    const releasesWithAnalysis = await Promise.all(
      releases.map(async (r: any) => {
        const data = {
          ...r,
          deploymentDate: r.deploymentDate?.toISOString?.(),
          createdAt: r.createdAt?.toISOString?.(),
          updatedAt: r.updatedAt?.toISOString?.(),
        };
        
        // Add AI risk assessment for high-risk releases
        if (r.releaseRiskIndex >= 50) {
          try {
            const aiProvider = await aiProviderManager.getActiveProvider();
            if (aiProvider) {
              const riskSummary = r.risks?.map((risk: any) => `${risk.severity}`).join(', ') || 'No risks';
              const prompt = `Quick risk assessment for release ${r.version} with risk index ${r.releaseRiskIndex}/100 and ${riskSummary} severity risks. 1-2 sentences max.`;
              const response = await aiProviderManager.generateCompletion(prompt, { maxTokens: 150, temperature: 0.3 });
              return { ...data, aiRiskAssessment: response.content };
            }
          } catch (error) {
            console.log('AI risk assessment failed:', error);
          }
        }
        
        return data;
      })
    );

    return NextResponse.json({
      data: releasesWithAnalysis,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      aiProvider: (await aiProviderManager.getActiveProvider())?.displayName || null,
    });
  } catch (error) {
    console.error('[Releases GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/releases
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const {
      version, description, deploymentDate, status,
      prSize, reviewDurationHours, failedBuildRate,
      testCoverage, deploymentsPerWeek, reopenedIssues,
    } = body;

    if (!version || !deploymentDate) {
      return NextResponse.json({ error: 'version and deploymentDate are required' }, { status: 400 });
    }

    // Auto-calculate scores if signals provided
    let engineeringScore = 0.5;
    let releaseRiskIndex = 50;

    if (prSize != null || testCoverage != null) {
      engineeringScore = calculateEngineeringScore({
        testCoverage:       testCoverage       ?? 50,
        reviewDurationHours: reviewDurationHours ?? 24,
        failedBuildRate:    failedBuildRate    ?? 0.1,
        deploymentsPerWeek: deploymentsPerWeek ?? 5,
        reopenedIssues:     reopenedIssues     ?? 2,
        prSize:             prSize             ?? 500,
      });
      releaseRiskIndex = calculateReleaseRiskIndex(engineeringScore, 0);
    }

    const release = await prisma.release.create({
      data: {
        version, description: description || null,
        deploymentDate: new Date(deploymentDate),
        status: status ?? 'PENDING',
        engineeringScore,
        userJourneyScore: engineeringScore * 0.9,
        releaseRiskIndex,
        prSize: prSize ?? null,
        reviewDurationHours: reviewDurationHours ?? null,
        failedBuildRate: failedBuildRate ?? null,
        testCoverage: testCoverage ?? null,
        deploymentsPerWeek: deploymentsPerWeek ?? null,
        reopenedIssues: reopenedIssues ?? null,
        tenantId: user.tenantId,
      },
    });

    await createAuditLog(user.tenantId, 'CREATE', 'Release', release.id, { version });
    
    // Send notification
    await notifyReleaseCreated(user.tenantId, release.id, version, releaseRiskIndex);

    return NextResponse.json(
      { ...release, deploymentDate: release.deploymentDate.toISOString(), createdAt: release.createdAt.toISOString(), updatedAt: release.updatedAt.toISOString() },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Version already exists for this tenant' }, { status: 409 });
    }
    console.error('[Releases POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
