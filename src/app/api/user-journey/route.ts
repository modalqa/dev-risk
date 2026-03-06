import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { aiProviderManager } from '@/lib/ai-provider';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const flows = await prisma.userJourneyFlow.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { stabilityScore: 'asc' },
    });

    const flowsWithAIPredictions = await Promise.all(
      flows.map(async (f) => {
        const data = {
          ...f,
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        };
        
        // AI prediction for flows with high dropoff
        if (f.dropoffRate > 0.2) {
          try {
            const aiProvider = await aiProviderManager.getActiveProvider();
            if (aiProvider) {
              const prompt = `User journey "${f.name}" has ${(f.dropoffRate * 100).toFixed(1)}% dropoff rate and ${f.incidentCount} incidents. What are the top 2 areas to optimize? Keep it brief.`;
              const response = await aiProviderManager.generateCompletion(prompt, { maxTokens: 200, temperature: 0.5 });
              return { ...data, aiOptimizationSuggestion: response.content };
            }
          } catch (error) {
            console.log('AI optimization suggestion failed:', error);
          }
        }
        
        return data;
      })
    );

    return NextResponse.json({
      data: flowsWithAIPredictions,
      aiProvider: (await aiProviderManager.getActiveProvider())?.displayName || null,
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, dropoffRate, incidentCount, stabilityScore } = body;

    const flow = await prisma.userJourneyFlow.create({
      data: {
        name,
        dropoffRate: dropoffRate ?? 0,
        incidentCount: incidentCount ?? 0,
        stabilityScore: stabilityScore ?? 0.5,
        tenantId: user.tenantId,
      },
    });

    return NextResponse.json({ ...flow, createdAt: flow.createdAt.toISOString(), updatedAt: flow.updatedAt.toISOString() }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
