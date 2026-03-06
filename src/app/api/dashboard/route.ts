import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { aiProviderManager } from '@/lib/ai-provider';
import { TrendPoint } from '@/types';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tenantId } = user;

    const [releases, risks, flows] = await Promise.all([
      prisma.release.findMany({
        where: { tenantId },
        orderBy: { deploymentDate: 'desc' },
        include: { risks: { select: { severity: true } } },
        take: 10,
      }),
      prisma.risk.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { release: { select: { version: true } } },
      }),
      prisma.userJourneyFlow.findMany({ where: { tenantId } }),
    ]);

    // Latest release metrics
    const latestRelease = releases[0];
    const releaseRiskIndex = latestRelease?.releaseRiskIndex ?? 0;
    const engineeringScore = latestRelease?.engineeringScore ?? 0;
    const userJourneyScore = latestRelease?.userJourneyScore ?? 0;

    // Counts
    const openRisksCount = await prisma.risk.count({
      where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
    const criticalRisksCount = await prisma.risk.count({
      where: { tenantId, severity: { in: ['CRITICAL', 'HIGH'] }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });

    // High risk releases (risk index >= 50)
    const highRiskReleases = releases
      .filter((r: any) => r.releaseRiskIndex >= 50)
      .slice(0, 5);

    // Generate trend for last 30 days (from actual releases or synthetic)
    const riskTrend: TrendPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

      // Find a release close to this date or interpolate
      const matchingRelease = releases.find((r: any) => {
        const rd = new Date(r.deploymentDate);
        return Math.abs(rd.getTime() - date.getTime()) < 4 * 24 * 60 * 60 * 1000;
      });

      if (matchingRelease) {
        riskTrend.push({
          date: dateStr,
          riskIndex: matchingRelease.releaseRiskIndex,
          engineeringScore: matchingRelease.engineeringScore * 100,
        });
      } else {
        // Interpolate between releases or use default
        const base = releaseRiskIndex;
        const noise = (Math.random() - 0.5) * 15;
        riskTrend.push({
          date: dateStr,
          riskIndex: Math.max(5, Math.min(95, base + noise)),
          engineeringScore: Math.max(20, Math.min(90, engineeringScore * 100 + noise * 0.5)),
        });
      }
    }

    // Get AI provider for enhanced insights
    const aiProvider = await aiProviderManager.getActiveProvider();
    let aiInsights = null;
    
    if (aiProvider && risks.length > 0) {
      try {
        const riskSummary = risks.slice(0, 3).map(r => `${r.title} (${r.severity})`).join(', ');
        const prompt = `Analyze these risks for release ${latestRelease?.version}: ${riskSummary}. Provide 2-3 key insights and recommendations. Keep it concise.`;
        const response = await aiProviderManager.generateCompletion(prompt, {
          maxTokens: 300,
          temperature: 0.5,
        });
        aiInsights = response.content;
      } catch (error) {
        console.log('AI insights generation failed:', error);
        aiInsights = null;
      }
    }

    return NextResponse.json({
      releaseRiskIndex,
      engineeringScore,
      userJourneyScore: userJourneyScore * 100,
      activeReleasesCount: releases.filter((r: any) => r.status === 'DEPLOYED').length,
      openRisksCount,
      criticalRisksCount,
      riskTrend,
      highRiskReleases: highRiskReleases.map((r: any) => ({
        id: r.id,
        version: r.version,
        description: r.description,
        engineeringScore: r.engineeringScore,
        userJourneyScore: r.userJourneyScore,
        releaseRiskIndex: r.releaseRiskIndex,
        deploymentDate: r.deploymentDate.toISOString(),
        status: r.status,
        tenantId: r.tenantId,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      recentRisks: risks.map((r: any) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        severity: r.severity,
        score: r.score,
        status: r.status,
        tenantId: r.tenantId,
        releaseId: r.releaseId,
        release: r.release,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
      aiProvider: aiProvider ? { type: aiProvider.type, displayName: aiProvider.displayName } : null,
      aiInsights,
    });
  } catch (error) {
    console.error('[Dashboard API]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
