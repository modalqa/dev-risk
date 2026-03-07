import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { aiProviderManager } from '@/lib/ai-provider';

// ── Types ───────────────────────────────────────────────────────────────────

interface SuggestedRisk {
  title: string;
  description: string;
  category: 'ENGINEERING' | 'USER_JOURNEY' | 'RELEASE_PROCESS' | 'SECURITY' | 'PERFORMANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
}

// ── Prompt Builder ──────────────────────────────────────────────────────────

function buildSuggestRisksPrompt(
  release: {
    version: string;
    description: string | null;
    prSize?: number | null;
    reviewDurationHours?: number | null;
    failedBuildRate?: number | null;
    testCoverage?: number | null;
    deploymentsPerWeek?: number | null;
    reopenedIssues?: number | null;
  },
  existingRisks: Array<{ title: string; category: string }>,
): string {
  const existingList = existingRisks.length > 0
    ? `\nEXISTING RISKS (do NOT duplicate these):\n${existingRisks.map((r, i) => `${i + 1}. ${r.title} (${r.category})`).join('\n')}`
    : '';

  return `You are a professional software release risk analyst. Based on the release description below, identify potential risks that the team should track.

RELEASE INFORMATION:
- Version: ${release.version}
- Description: ${release.description || 'No description provided'}
- PR Size: ${release.prSize != null ? `${release.prSize} LOC` : 'N/A'}
- Review Duration: ${release.reviewDurationHours != null ? `${release.reviewDurationHours} hours` : 'N/A'}
- Failed Build Rate: ${release.failedBuildRate != null ? `${(release.failedBuildRate * 100).toFixed(1)}%` : 'N/A'}
- Test Coverage: ${release.testCoverage != null ? `${release.testCoverage}%` : 'N/A'}
- Deploys/Week: ${release.deploymentsPerWeek ?? 'N/A'}
- Reopened Issues: ${release.reopenedIssues ?? 'N/A'}
${existingList}

Analyze the release description and engineering metrics carefully. Identify 3-5 specific risks that are directly relevant to this release.

Each risk must have:
- A clear, specific title (not generic)
- A detailed description explaining why this is a risk for THIS specific release
- An appropriate category: ENGINEERING, USER_JOURNEY, RELEASE_PROCESS, SECURITY, or PERFORMANCE
- A severity level: LOW, MEDIUM, HIGH, or CRITICAL
- A risk score from 0-100 (higher = more risky)

Respond ONLY with valid JSON (no markdown, no backticks), in this exact format:

{
  "risks": [
    {
      "title": "Specific risk title",
      "description": "Detailed explanation of why this is a risk",
      "category": "ENGINEERING",
      "severity": "HIGH",
      "score": 75
    }
  ]
}

RULES:
- Risks MUST be specific to the release description, NOT generic
- Do NOT repeat existing risks
- Score must reflect severity: CRITICAL >= 75, HIGH 50-74, MEDIUM 25-49, LOW 0-24
- All text in English
- Return valid JSON only`;
}

// ── AI Response Parser ──────────────────────────────────────────────────────

function parseSuggestedRisks(content: string): SuggestedRisk[] {
  let jsonStr = content.trim();

  // Strip markdown code blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();

  // Extract the first JSON object
  const objMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objMatch) jsonStr = objMatch[0];

  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed.risks)) {
    throw new Error('Invalid response: missing risks array');
  }

  const validCategories = ['ENGINEERING', 'USER_JOURNEY', 'RELEASE_PROCESS', 'SECURITY', 'PERFORMANCE'];
  const validSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return parsed.risks
    .filter((r: any) => r.title && r.description && r.category && r.severity)
    .map((r: any) => ({
      title: String(r.title).slice(0, 200),
      description: String(r.description).slice(0, 2000),
      category: validCategories.includes(r.category) ? r.category : 'ENGINEERING',
      severity: validSeverities.includes(r.severity) ? r.severity : 'MEDIUM',
      score: Math.max(0, Math.min(100, Number(r.score) || 50)),
    }));
}

// ── POST: Generate suggested risks from release description ─────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: { releaseId: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 1. Fetch release
    const release = await prisma.release.findFirst({
      where: { id: params.releaseId, tenantId: user.tenantId },
      include: {
        risks: { select: { title: true, category: true } },
      },
    });

    if (!release) {
      return NextResponse.json({ error: 'Release not found' }, { status: 404 });
    }

    if (!release.description || release.description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Release has no description. Add a description first so AI can analyze potential risks.' },
        { status: 400 },
      );
    }

    // 2. Check AI provider
    const aiProvider = await aiProviderManager.getActiveProvider();
    if (!aiProvider) {
      return NextResponse.json(
        { error: 'No active AI provider configured. Set up an AI provider in Settings → AI Providers.' },
        { status: 400 },
      );
    }

    console.log(`[AI Suggest Risks] Generating risks for release ${release.version}`);
    console.log(`[AI Suggest Risks] Description length: ${release.description.length} chars`);

    // 3. Build prompt & call AI
    const prompt = buildSuggestRisksPrompt(release, release.risks);

    const aiResponse = await aiProviderManager.generateCompletion(prompt, {
      maxTokens: 2000,
      temperature: 0.4,
    });

    console.log(`[AI Suggest Risks] AI response: ${aiResponse.content?.length || 0} chars`);

    // 4. Parse response
    let suggestedRisks: SuggestedRisk[];
    try {
      suggestedRisks = parseSuggestedRisks(aiResponse.content);
      console.log(`[AI Suggest Risks] Parsed ${suggestedRisks.length} risks`);
    } catch (parseError) {
      console.error('[AI Suggest Risks] Parse error:', parseError);
      console.error('[AI Suggest Risks] Raw response:', aiResponse.content?.substring(0, 500));
      return NextResponse.json(
        { error: 'AI returned an invalid response. Please try again.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      risks: suggestedRisks,
      releaseVersion: release.version,
      aiProvider: aiProvider.displayName,
    });
  } catch (error) {
    console.error('[AI Suggest Risks]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
