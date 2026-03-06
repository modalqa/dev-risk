import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { releaseId: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const analysisHistory = await prisma.aiAnalysisResult.findMany({
      where: {
        releaseId: params.releaseId,
        tenantId: user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 analysis results
    });

    return NextResponse.json({
      history: analysisHistory.map(result => ({
        id: result.id,
        analysisType: result.analysisType,
        confidenceScore: result.confidenceScore,
        risksAnalyzed: result.risksAnalyzed,
        risksUpdated: result.risksUpdated,
        processingTime: result.processingTime,
        improvements: result.improvements,
        riskPatterns: result.riskPatterns,
        beforeMetrics: result.beforeMetrics,
        afterMetrics: result.afterMetrics,
        createdAt: result.createdAt.toISOString(),
      }))
    });
  } catch (error) {
    console.error('[AI History]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}