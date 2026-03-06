import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { aiProviderManager } from '@/lib/ai-provider';
import { createAuditLog } from '@/lib/audit';
import { notifyRiskCreated } from '@/lib/notification';

// GET /api/risks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const releaseId = searchParams.get('releaseId');
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (severity) where.severity = severity;
    if (category) where.category = category;
    if (status)   where.status = status;
    if (releaseId) where.releaseId = releaseId;

    const [risks, total] = await Promise.all([
      prisma.risk.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { release: { select: { version: true } } },
      }),
      prisma.risk.count({ where }),
    ]);

    const risksWithAISuggestions = await Promise.all(
      risks.map(async (r: any) => {
        const data = {
          ...r,
          createdAt: r.createdAt?.toISOString?.(),
          updatedAt: r.updatedAt?.toISOString?.(),
        };
        
        // AI suggestions for critical/high severity risks
        if (['CRITICAL', 'HIGH'].includes(r.severity) && r.status === 'OPEN') {
          try {
            const aiProvider = await aiProviderManager.getActiveProvider();
            if (aiProvider) {
              const prompt = `Risk: ${r.title} (${r.severity}). Category: ${r.category}. ${r.description}. Suggest 1-2 specific mitigation steps.`;
              const response = await aiProviderManager.generateCompletion(prompt, { maxTokens: 200, temperature: 0.4 });
              return { ...data, aiMitigationSuggestion: response.content };
            }
          } catch (error) {
            console.log('AI mitigation suggestion failed:', error);
          }
        }
        
        return data;
      })
    );

    return NextResponse.json({
      data: risksWithAISuggestions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      aiProvider: (await aiProviderManager.getActiveProvider())?.displayName || null,
    });
  } catch (error) {
    console.error('[Risks GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/risks
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, category, severity, score, releaseId } = body;

    if (!title || !description || !category || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const risk = await prisma.risk.create({
      data: {
        title,
        description,
        category,
        severity,
        score: score ?? 50,
        tenantId: user.tenantId,
        releaseId: releaseId || null,
      },
    });

    await createAuditLog(user.tenantId, 'CREATE', 'Risk', risk.id, { title, severity });
    
    // Send notification
    await notifyRiskCreated(user.tenantId, risk.id, title, severity);

    return NextResponse.json({ ...risk, createdAt: risk.createdAt.toISOString(), updatedAt: risk.updatedAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error('[Risks POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
