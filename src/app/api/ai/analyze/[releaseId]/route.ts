import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { aiProviderManager } from '@/lib/ai-provider';

// ── Types ───────────────────────────────────────────────────────────────────

interface AnalysisOutput {
  recommendationLevel: 'HOLD' | 'REVIEW' | 'PROCEED' | 'CLEAR';
  recommendation: string;
  summary: string;
  rootCause: string;
  riskProjection: string;
  engineeringInsight: string;
  bestPractices: string[];
  affectedUsers: { min: number; max: number };
}

// ── Prompt Builder ──────────────────────────────────────────────────────────

function buildAnalysisPrompt(
  release: {
    version: string;
    engineeringScore: number;
    userJourneyScore: number;
    testCoverage?: number | null;
    prSize?: number | null;
    reviewDurationHours?: number | null;
    failedBuildRate?: number | null;
  },
  risks: Array<{
    title: string;
    severity: string;
    category: string;
    score: number;
    description: string;
    status: string;
  }>,
): string {
  const riskList = risks
    .map(
      (r, i) =>
        `${i + 1}. [${r.severity}] ${r.title} (Category: ${r.category}, Score: ${r.score}/100, Status: ${r.status})\n   Description: ${r.description}`,
    )
    .join('\n');

  return `You are a professional software release risk analysis system. Analyze the following risks and provide a structured assessment in English.

RELEASE INFORMATION:
- Version: ${release.version}
- Engineering Score: ${(release.engineeringScore * 100).toFixed(0)}%
- User Journey Score: ${(release.userJourneyScore * 100).toFixed(0)}%
- Test Coverage: ${release.testCoverage != null ? `${release.testCoverage}%` : 'N/A'}
- PR Size: ${release.prSize != null ? `${release.prSize} LOC` : 'N/A'}
- Review Duration: ${release.reviewDurationHours != null ? `${release.reviewDurationHours} hours` : 'N/A'}
- Failed Build Rate: ${release.failedBuildRate != null ? `${(release.failedBuildRate * 100).toFixed(1)}%` : 'N/A'}

RISK LIST (${risks.length} risks):
${riskList}

Based on the risk analysis above, provide your response in the following JSON format.
IMPORTANT: Response MUST be valid JSON only, WITHOUT markdown code blocks, WITHOUT backticks, WITHOUT any other text:

{
  "recommendationLevel": "HOLD or REVIEW or PROCEED or CLEAR",
  "recommendation": "Specific and actionable deployment recommendation, mention relevant risk names",
  "summary": "Executive summary of the release risk analysis. Include risk count, severity breakdown, and key metrics. Maximum 200 words.",
  "rootCause": "In-depth root cause analysis of identified risks. Explain primary causes and relationships between risks.",
  "riskProjection": "Impact projection on the product and users if risks are not mitigated within the next 1-3 sprints.",
  "engineeringInsight": "Technical insights and engineering improvement recommendations based on metrics and identified risks.",
  "bestPractices": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"],
  "affectedUsers": { "min": 5, "max": 15 }
}

STRICT RULES:
- If any CRITICAL risk exists → recommendationLevel MUST be "HOLD"
- If any HIGH risk exists without CRITICAL → recommendationLevel MUST be "REVIEW"
- If only MEDIUM/LOW → recommendationLevel "PROCEED"
- If all risks are very minor → recommendationLevel "CLEAR"
- MUST mention specific risk names in recommendation and summary
- affectedUsers = estimated percentage of affected users
- Provide detailed and actionable analysis, not generic
- All text must be in English`;
}

// ── AI Response Parser ──────────────────────────────────────────────────────

function parseAIResponse(content: string): AnalysisOutput {
  let jsonStr = content.trim();

  // Strip markdown code blocks if AI wrapped the response
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  // Extract the first JSON object
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objMatch) jsonStr = objMatch[0];

  const parsed = JSON.parse(jsonStr);

  // Validate recommendation level
  const validLevels = ['HOLD', 'REVIEW', 'PROCEED', 'CLEAR'] as const;
  const level = validLevels.includes(parsed.recommendationLevel)
    ? parsed.recommendationLevel
    : 'REVIEW';

  return {
    recommendationLevel: level,
    recommendation: String(parsed.recommendation || ''),
    summary: String(parsed.summary || ''),
    rootCause: String(parsed.rootCause || ''),
    riskProjection: String(parsed.riskProjection || ''),
    engineeringInsight: String(parsed.engineeringInsight || ''),
    bestPractices: Array.isArray(parsed.bestPractices)
      ? parsed.bestPractices.map(String)
      : [],
    affectedUsers: {
      min: Number(parsed.affectedUsers?.min) || 0,
      max: Number(parsed.affectedUsers?.max) || 0,
    },
  };
}

// ── Risk Index Calculation ──────────────────────────────────────────────────

function calculateRiskIndexFromRisks(
  risks: Array<{ score: number; severity: string }>,
  engineeringScore: number,
): number {
  if (risks.length === 0) return 0;

  const severityBoost: Record<string, number> = {
    CRITICAL: 1.3,
    HIGH: 1.15,
    MEDIUM: 1.0,
    LOW: 0.85,
  };

  const boosted = risks.map((r) =>
    Math.min(100, r.score * (severityBoost[r.severity] || 1.0)),
  );
  const avgRiskScore = boosted.reduce((a, b) => a + b, 0) / risks.length;

  // Blend: 70% from risk scores, 30% from engineering gap
  const engineeringGap = (1 - engineeringScore) * 100;
  const riskIndex = avgRiskScore * 0.7 + engineeringGap * 0.3;

  return Math.round(Math.max(0, Math.min(100, riskIndex)));
}

// ── GET: Fetch latest analysis ──────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: { releaseId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const analysis = await prisma.aiAnalysisResult.findFirst({
      where: { releaseId: params.releaseId, tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysis) {
      return NextResponse.json({ analysis: null });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[AI Analyze GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ── POST: Run AI Analysis ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { releaseId: string } },
) {
  const startTime = Date.now();

  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 1. Fetch release + risks
    const release = await prisma.release.findFirst({
      where: { id: params.releaseId, tenantId: user.tenantId },
      include: {
        risks: { orderBy: [{ severity: 'desc' }, { score: 'desc' }] },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    if (release.risks.length === 0) {
      return NextResponse.json(
        { error: 'No risk items to analyze. Add risks first before running analysis.' },
        { status: 400 },
      );
    }

    // 2. Check AI provider
    const aiProvider = await aiProviderManager.getActiveProvider();
    if (!aiProvider) {
      return NextResponse.json(
        { error: 'No active AI provider configured. Set up an AI provider in Superadmin → AI Providers.' },
        { status: 400 },
      );
    }

    console.log(`[AI Analysis] Starting analysis for release ${release.version} with ${release.risks.length} risks`);
    console.log(`[AI Analysis] Using AI provider: ${aiProvider.type} (${aiProvider.name})`);

    // 3. Build prompt
    const prompt = buildAnalysisPrompt(release, release.risks);
    console.log(`[AI Analysis] Prompt built: ${prompt.length} chars`);

    // 4. Call AI provider
    const aiResponse = await aiProviderManager.generateCompletion(prompt, {
      maxTokens: 2000,
      temperature: 0.3,
    });

    console.log(`[AI Analysis] AI response received: ${aiResponse.content?.length || 0} chars`);

    // 5. Parse AI response
    let analysisOutput: AnalysisOutput;
    try {
      analysisOutput = parseAIResponse(aiResponse.content);
      console.log(`[AI Analysis] Parsed successfully — level: ${analysisOutput.recommendationLevel}`);
    } catch (parseError) {
      console.error('[AI Analysis] Failed to parse AI response:', parseError);
      console.error('[AI Analysis] Raw response:', aiResponse.content?.substring(0, 500));
      return NextResponse.json(
        { error: 'AI returned an invalid response format. Please try running the analysis again.' },
        { status: 500 },
      );
    }

    // 6. Recalculate release risk index from actual risks
    const newRiskIndex = calculateRiskIndexFromRisks(release.risks, release.engineeringScore);

    // Calculate score impacts based on risk categories
    const ujRisks = release.risks.filter((r) => r.category === 'USER_JOURNEY');
    const engRisks = release.risks.filter((r) => r.category === 'ENGINEERING');

    const ujImpact = ujRisks.length > 0
      ? ujRisks.reduce((s, r) => s + r.score, 0) / ujRisks.length / 100
      : 0;
    const engImpact = engRisks.length > 0
      ? engRisks.reduce((s, r) => s + r.score, 0) / engRisks.length / 100
      : 0;

    const baseEng = release.engineeringScore || 0.5;
    const baseUj = release.userJourneyScore || 0.5;
    const newEngScore = Math.max(0.1, baseEng * (1 - engImpact * 0.3));
    const newUjScore = Math.max(0.1, baseUj * (1 - ujImpact * 0.4));

    // 7. Save analysis to DB
    const processingTime = Date.now() - startTime;

    const savedAnalysis = await prisma.aiAnalysisResult.create({
      data: {
        releaseId: release.id,
        tenantId: user.tenantId,
        analysisType: 'release_risk_analysis',
        riskPatterns: release.risks.map((r) => ({
          title: r.title,
          severity: r.severity,
          category: r.category,
          score: r.score,
          status: r.status,
        })),
        recommendations: analysisOutput as any,
        improvements: analysisOutput.bestPractices,
        confidenceScore: 0.9,
        risksAnalyzed: release.risks.length,
        risksUpdated: 0,
        beforeMetrics: {
          releaseRiskIndex: release.releaseRiskIndex,
          engineeringScore: release.engineeringScore,
          userJourneyScore: release.userJourneyScore,
        },
        afterMetrics: {
          releaseRiskIndex: newRiskIndex,
          engineeringScore: newEngScore,
          userJourneyScore: newUjScore,
        },
        processingTime,
      },
    });

    // 8. Update release with recalculated metrics
    await prisma.release.update({
      where: { id: release.id },
      data: {
        releaseRiskIndex: newRiskIndex,
        engineeringScore: newEngScore,
        userJourneyScore: newUjScore,
        updatedAt: new Date(),
      },
    });

    console.log(`[AI Analysis] ✅ Complete in ${processingTime}ms — riskIndex: ${release.releaseRiskIndex} → ${newRiskIndex}`);

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      metrics: {
        riskIndex: newRiskIndex,
        engineeringScore: newEngScore,
        userJourneyScore: newUjScore,
      },
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`[AI Analysis] ❌ Failed after ${processingTime}ms:`, error);

    const message = error.message?.includes('API key')
      ? 'Invalid AI provider API key. Check configuration in Superadmin → AI Providers.'
      : error.message?.includes('not responsive') || error.message?.includes('timeout')
        ? 'AI provider is not responding. Make sure the service is running.'
        : error.message?.includes('No active AI provider')
          ? 'No active AI provider configured. Set up a provider in Superadmin → AI Providers.'
          : 'Failed to run analysis. Please try again or check AI provider configuration.';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
