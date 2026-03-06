// ============================================
// DevRisk AI - Risk Engine (Phase 1)
// Implements weighted scoring model from PRD
// ============================================

export interface EngineeringSignals {
  testCoverage: number;        // 0-100 (%)
  reviewDurationHours: number; // hours
  failedBuildRate: number;     // 0-1
  deploymentsPerWeek: number;  // count
  reopenedIssues: number;      // count
  prSize: number;              // lines of code
}

export interface UserJourneySignals {
  dropoffRate: number;    // 0-1
  incidentCount: number;  // count
}

export interface RiskScores {
  engineeringScore: number;    // 0-1 (higher = better stability)
  userJourneyScore: number;    // 0-100 (higher = better)
  releaseRiskIndex: number;    // 0-100 (higher = more risky)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Normalize a value to 0-1 (capped at 1)
function normalize(value: number, threshold: number): number {
  return Math.min(value / threshold, 1);
}

/**
 * Layer 2: Engineering Stability Score
 * Formula from PRD:
 * (0.25 × test_coverage_weighted)
 * + (0.20 × review_duration_weighted)
 * + (0.20 × failed_build_inverse)
 * + (0.15 × deployment_stability)
 * + (0.20 × reopened_issue_inverse)
 */
export function calculateEngineeringScore(signals: EngineeringSignals): number {
  const testCoverageWeighted = signals.testCoverage / 100;
  const reviewDurationWeighted = 1 - normalize(signals.reviewDurationHours, 72);
  const failedBuildInverse = 1 - signals.failedBuildRate;
  const deploymentStability = 1 - normalize(signals.deploymentsPerWeek, 10);
  const reopenedIssueInverse = 1 - normalize(signals.reopenedIssues, 20);
  const prSizeInverse = 1 - normalize(signals.prSize, 3000);

  const score =
    0.25 * testCoverageWeighted +
    0.20 * reviewDurationWeighted +
    0.20 * failedBuildInverse +
    0.15 * deploymentStability +
    0.15 * reopenedIssueInverse +
    0.05 * prSizeInverse;

  return Math.max(0, Math.min(1, score));
}

/**
 * Release Risk Index
 * Formula from PRD:
 * (1 - engineering_score) * 0.6 + (high_severity_risk_ratio * 0.4)
 */
export function calculateReleaseRiskIndex(
  engineeringScore: number,
  highSeverityRiskRatio: number
): number {
  const index = (1 - engineeringScore) * 0.6 + highSeverityRiskRatio * 0.4;
  return Math.round(Math.max(0, Math.min(100, index * 100)) * 10) / 10;
}

/**
 * User Journey Stability Score
 * Formula from PRD:
 * (1 - dropoff_risk_weighted) * 0.5 + (incident_ratio_inverse * 0.5)
 */
export function calculateUserJourneyScore(signals: UserJourneySignals): number {
  const dropoffRiskWeighted = signals.dropoffRate;
  const incidentRatioInverse = 1 - normalize(signals.incidentCount, 10);

  const score = (1 - dropoffRiskWeighted) * 0.5 + incidentRatioInverse * 0.5;
  return Math.round(Math.max(0, Math.min(1, score)) * 1000) / 10;
}

export function getRiskLevel(riskIndex: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskIndex >= 75) return 'CRITICAL';
  if (riskIndex >= 50) return 'HIGH';
  if (riskIndex >= 25) return 'MEDIUM';
  return 'LOW';
}

export function getRiskColor(riskIndex: number): string {
  const level = getRiskLevel(riskIndex);
  switch (level) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH':     return '#ef4444';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#10b981';
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return '#dc2626';
    case 'HIGH':     return '#ef4444';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#10b981';
    default:         return '#6b7280';
  }
}

/**
 * Calculate all scores from release signals
 */
export function calculateAllScores(
  signals: EngineeringSignals,
  totalRisks: number,
  highSeverityRisks: number
): RiskScores {
  const engineeringScore = calculateEngineeringScore(signals);
  const highSeverityRatio = totalRisks > 0 ? highSeverityRisks / totalRisks : 0;
  const releaseRiskIndex = calculateReleaseRiskIndex(engineeringScore, highSeverityRatio);
  const userJourneyScore = calculateUserJourneyScore({
    dropoffRate: signals.failedBuildRate * 0.5,
    incidentCount: Math.round(signals.reopenedIssues * 0.3),
  });

  return {
    engineeringScore,
    userJourneyScore,
    releaseRiskIndex,
    riskLevel: getRiskLevel(releaseRiskIndex),
  };
}
