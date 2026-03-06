// ============================================
// DevRisk - Smart Risk Analysis Engine
// Pattern-based analysis using industry best practices
// No AI/LLM dependency — pure deterministic logic
// ============================================

export interface RiskDriver {
  title: string;
  category: string;
  severity: string;
  description: string;
}

export interface SmartAnalysis {
  summary: string;
  rootCause: string;
  topDrivers: RiskDriver[];
  affectedUsers: { min: number; max: number };
  recommendation: string;
  recommendationLevel: 'HOLD' | 'REVIEW' | 'PROCEED' | 'CLEAR';
  riskProjection: string;
  engineeringInsight: string;
  bestPractices: string[];
  generatedAt: string;
}

// ── Root Cause Detection ────────────────────────────────────────────────────

const ROOT_CAUSE_MAP: Record<string, string> = {
  ENGINEERING:      'engineering quality issues (low test coverage, large PR size, insufficient code review)',
  USER_JOURNEY:     'user experience degradation (high drop-off rate, incidents on critical flows)',
  RELEASE_PROCESS:  'overly aggressive release process (high deployment frequency, missing rollback plan)',
  SECURITY:         'unmitigated security vulnerabilities (vulnerability gaps, compliance issues)',
  PERFORMANCE:      'system performance degradation (high latency, timeouts, resource bottlenecks)',
};

function detectRootCauses(categories: string[], riskIndex: number): string {
  const causes = categories.map((c) => ROOT_CAUSE_MAP[c]).filter(Boolean);

  if (causes.length === 0) return 'No specific root cause identified from existing patterns.';
  if (causes.length === 1) return `Primary root cause identified in area: ${causes[0]}.`;
  return `Root causes identified across multiple areas: ${causes.join('; ')}.`;
}

// ── Risk Projection ─────────────────────────────────────────────────────────

function projectRisk(riskIndex: number, engineeringScore: number): string {
  if (riskIndex >= 75) {
    const incidentProb = Math.round(riskIndex * 0.6);
    return (
      `Without mitigation, risk index is projected to remain >70 for the next 2–3 sprints. ` +
      `Production incident probability: ~${incidentProb}%. ` +
      `Recommendation: focus on critical risk mitigation before deployment.`
    );
  }
  if (riskIndex >= 50) {
    return (
      `With partial mitigation, risk index can drop to ${Math.round(riskIndex * 0.75)}–${Math.round(riskIndex * 0.85)} within 1–2 sprints. ` +
      `Staged rollout with close monitoring is required.`
    );
  }
  if (riskIndex >= 25) {
    return (
      `Risk trend is stable. By maintaining engineering quality, projected to drop to ~${Math.round(riskIndex * 0.7)} next sprint. ` +
      `Continue monitoring key metrics.`
    );
  }
  return 'Engineering health is good. Low risk projected to continue as long as quality standards are maintained.';
}

// ── Engineering Insight ─────────────────────────────────────────────────────

function analyzeEngineering(score: number, prSize: number, testCoverage: number): string {
  const findings: string[] = [];

  if (testCoverage < 50) {
    findings.push(`test coverage critical at ${testCoverage.toFixed(0)}% (best practice: ≥70%)`);
  } else if (testCoverage < 70) {
    findings.push(`test coverage at ${testCoverage.toFixed(0)}% needs improvement (target: ≥70%)`);
  }

  if (prSize > 2000) {
    findings.push(`large PR size (${prSize.toLocaleString()} LOC) — split into smaller PRs to reduce risk`);
  } else if (prSize > 1000) {
    findings.push(`PR size ${prSize.toLocaleString()} LOC exceeds ideal threshold (≤500 LOC)`);
  }

  if (score < 0.4) {
    findings.push('engineering stability below critical threshold — immediate improvement needed');
  } else if (score < 0.6) {
    findings.push('engineering stability moderate — significant room for improvement');
  }

  if (findings.length === 0) return 'Engineering quality is at a good level in line with best practices.';
  return `Areas requiring attention: ${findings.join('; ')}.`;
}

// ── Best Practice Recommendations ───────────────────────────────────────────

function generateBestPractices(
  risks: Array<{ severity: string; category: string; status: string }>,
  engineeringScore: number,
  testCoverage: number | null,
  prSize: number | null,
): string[] {
  const practices: string[] = [];

  const criticalCount = risks.filter((r) => r.severity === 'CRITICAL').length;
  const highCount = risks.filter((r) => r.severity === 'HIGH').length;
  const openCount = risks.filter((r) => r.status === 'OPEN').length;
  const categories = new Set(risks.map((r) => r.category));

  // Severity-based practices
  if (criticalCount > 0) {
    practices.push('Resolve all CRITICAL risks before proceeding to deployment');
  }
  if (highCount > 0) {
    practices.push('Review and mitigate HIGH severity risks with a staged rollout');
  }
  if (openCount > 3) {
    practices.push('Too many open risks — prioritize based on impact & likelihood');
  }

  // Category-based practices
  if (categories.has('SECURITY')) {
    practices.push('Conduct security review & penetration testing before release');
  }
  if (categories.has('PERFORMANCE')) {
    practices.push('Run load testing to validate performance under peak traffic');
  }
  if (categories.has('USER_JOURNEY')) {
    practices.push('Validate critical user flows with regression testing');
  }

  // Engineering-based practices
  if ((testCoverage ?? 100) < 60) {
    practices.push('Increase test coverage to ≥70% — focus on critical paths');
  }
  if ((prSize ?? 0) > 1500) {
    practices.push('Break large PRs into smaller, reviewable chunks (≤500 LOC ideal)');
  }
  if (engineeringScore < 0.5) {
    practices.push('Invest time in a technical debt reduction sprint');
  }

  // General best practices
  if (practices.length === 0) {
    practices.push('Release is in good condition — continue following standard deployment checklist');
    practices.push('Monitor post-deployment metrics for the first 24–48 hours');
  } else {
    practices.push('Prepare a rollback plan and monitor post-deployment');
  }

  return practices;
}

// ── Main Analysis Function ──────────────────────────────────────────────────

export function generateSmartAnalysis(
  release: {
    version: string;
    releaseRiskIndex: number;
    engineeringScore: number;
    userJourneyScore: number;   // already 0–100 from caller
    prSize?: number | null;
    testCoverage?: number | null;
  },
  risks: Array<{
    title: string;
    severity: string;
    category: string;
    description: string;
    score?: number;
    status?: string;
  }>,
): SmartAnalysis {
  const riskIndex = release.releaseRiskIndex;

  const criticalRisks = risks.filter((r) => r.severity === 'CRITICAL');
  const highRisks     = risks.filter((r) => r.severity === 'HIGH');
  const allHighSevere = [...criticalRisks, ...highRisks];

  // Affected-user estimation
  const severityMultiplier = criticalRisks.length > 0 ? 1.5 : highRisks.length > 0 ? 1.2 : 1.0;
  const affectedUserMin = Math.max(Math.round(riskIndex * 0.1 * severityMultiplier), 2);
  const affectedUserMax = Math.round(riskIndex * 0.2 * severityMultiplier);

  const categories = Array.from(new Set(risks.map((r) => r.category)));
  const topDrivers = allHighSevere.slice(0, 3);

  // ── Recommendation Logic (pattern-based decision tree) ──
  let recommendationLevel: SmartAnalysis['recommendationLevel'];
  let recommendation: string;

  const hasCritical = criticalRisks.length > 0;
  const hasHigh = highRisks.length > 0;
  const totalHighSevere = allHighSevere.length;

  if (hasCritical || (hasHigh && totalHighSevere >= 2)) {
    recommendationLevel = 'HOLD';
    recommendation =
      `🛑 HOLD RELEASE — Found ${criticalRisks.length} CRITICAL and ${highRisks.length} HIGH severity risks: ` +
      `${allHighSevere.map((r) => r.title).join(', ')}. ` +
      `Estimated impact: ${affectedUserMin}–${affectedUserMax}% of users. ` +
      `Resolve these risk items before proceeding with deployment.`;
  } else if (hasHigh || riskIndex >= 50) {
    recommendationLevel = 'REVIEW';
    recommendation =
      `⚠️ REVIEW REQUIRED — ${hasHigh ? `${highRisks.length} HIGH severity risk found` : `Risk index ${riskIndex.toFixed(0)}/100`}. ` +
      (allHighSevere.length > 0 ? `Risks: ${allHighSevere.map((r) => r.title).join(', ')}. ` : '') +
      `Perform a staged rollout and monitor closely before full deployment.`;
  } else if (riskIndex >= 25 || risks.length > 0) {
    recommendationLevel = 'PROCEED';
    recommendation =
      `✅ PROCEED WITH CAUTION — Risk index ${riskIndex.toFixed(0)}/100 with ${risks.length} risks identified. ` +
      (risks.length > 0
        ? `Risks: ${risks.slice(0, 3).map((r) => `${r.title} (${r.severity})`).join(', ')}` +
          (risks.length > 3 ? ` and ${risks.length - 3} more` : '') + '. '
        : '') +
      `Monitor deployment and prepare a rollback plan.`;
  } else {
    recommendationLevel = 'CLEAR';
    recommendation =
      `✅ CLEAR TO DEPLOY — Risk index ${riskIndex.toFixed(0)}/100. ` +
      `No high-severity risks. Engineering health is good. Proceed with standard deployment.`;
  }

  // ── Summary ──
  const riskDetail = allHighSevere.length > 0
    ? `ATTENTION: ${criticalRisks.length} CRITICAL and ${highRisks.length} HIGH-severity risks — ` +
      `${allHighSevere.slice(0, 2).map((r) => r.title).join(', ')}` +
      (allHighSevere.length > 2 ? ` and ${allHighSevere.length - 2} more` : '') + '. '
    : risks.length > 0
      ? `${risks.length} risks with low–medium severity. `
      : 'No critical/high risk. ';

  const summary =
    `Release ${release.version} — Risk Index ${riskIndex.toFixed(0)}/100 with ${risks.length} risks identified. ` +
    riskDetail +
    `Engineering Stability: ${(release.engineeringScore * 100).toFixed(0)}%. ` +
    `User Journey Stability: ${release.userJourneyScore.toFixed(0)}%.`;

  // ── Root Cause ──
  let rootCause = detectRootCauses(categories, riskIndex);
  if (allHighSevere.length > 0) {
    rootCause += ` Critical risks: ${allHighSevere.map((r) => `${r.title} (${r.category})`).slice(0, 3).join(', ')}.`;
  }

  // ── Best Practices ──
  const bestPractices = generateBestPractices(
    risks as any,
    release.engineeringScore,
    release.testCoverage ?? null,
    release.prSize ?? null,
  );

  return {
    summary,
    rootCause,
    topDrivers,
    affectedUsers: { min: affectedUserMin, max: affectedUserMax },
    recommendation,
    recommendationLevel,
    riskProjection: projectRisk(riskIndex, release.engineeringScore),
    engineeringInsight: analyzeEngineering(
      release.engineeringScore,
      release.prSize ?? 0,
      release.testCoverage ?? 50,
    ),
    bestPractices,
    generatedAt: new Date().toISOString(),
  };
}
