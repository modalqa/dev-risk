// ============================================
// DevRisk AI - Predictive Risk Engine (Phase 3)
// Time-series regression & risk forecasting
// ============================================

import { prisma } from './prisma';

export interface HistoricalDataPoint {
  date: Date;
  riskIndex: number;
  engineeringScore: number;
  userJourneyScore: number;
  prSize: number;
  deploymentFrequency: number;
  failedBuildRate: number;
  incidentCount: number;
}

export interface RiskForecast {
  date: string;
  predictedRiskIndex: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number; // Probability of high-risk
}

export interface PredictionResult {
  currentRiskIndex: number;
  currentTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  trendStrength: number; // 0-1
  forecasts: RiskForecast[];
  insights: string[];
  recommendations: string[];
  stabilityDecayCurve: { week: number; predictedScore: number }[];
  confidenceScore: number;
}

export interface ScenarioInput {
  deploymentFrequencyChange: number; // percentage change e.g., 0.2 = +20%
  prSizeChange: number;
  testCoverageChange: number;
}

export interface ScenarioResult {
  baselineRiskIndex: number;
  predictedRiskIndex: number;
  riskChange: number;
  riskChangePercent: number;
  newRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
}

// ============================================
// Statistical Functions
// ============================================

/**
 * Simple Linear Regression
 * Returns slope (m) and intercept (b) for y = mx + b
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, r2: 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((acc, yi) => acc + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((acc, yi, i) => acc + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept, r2 };
}

/**
 * Exponential Moving Average for smoothing
 */
function exponentialMovingAverage(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(alpha * data[i] + (1 - alpha) * ema[i - 1]);
  }
  return ema;
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Calculate trend direction and strength
 */
function calculateTrend(values: number[]): { direction: 'IMPROVING' | 'STABLE' | 'WORSENING'; strength: number } {
  if (values.length < 3) {
    return { direction: 'STABLE', strength: 0 };
  }

  const x = values.map((_, i) => i);
  const { slope, r2 } = linearRegression(x, values);

  // For risk index: positive slope = worsening, negative = improving
  let direction: 'IMPROVING' | 'STABLE' | 'WORSENING';
  
  if (Math.abs(slope) < 1) {
    direction = 'STABLE';
  } else if (slope > 0) {
    direction = 'WORSENING';
  } else {
    direction = 'IMPROVING';
  }

  return { direction, strength: Math.min(r2, 1) };
}

/**
 * Get risk level from index
 */
function getRiskLevel(riskIndex: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (riskIndex >= 75) return 'CRITICAL';
  if (riskIndex >= 50) return 'HIGH';
  if (riskIndex >= 25) return 'MEDIUM';
  return 'LOW';
}

// ============================================
// Data Fetching
// ============================================

/**
 * Fetch historical data for a tenant
 */
async function fetchHistoricalData(
  tenantId: string,
  weeks: number = 12
): Promise<HistoricalDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Get releases with metrics
  const releases = await prisma.release.findMany({
    where: {
      tenantId,
      deploymentDate: { gte: startDate },
    },
    orderBy: { deploymentDate: 'asc' },
    include: {
      risks: {
        where: { severity: { in: ['HIGH', 'CRITICAL'] } },
      },
    },
  });

  // Get build data grouped by week
  const builds = await prisma.buildData.findMany({
    where: {
      tenantId,
      startedAt: { gte: startDate },
    },
    orderBy: { startedAt: 'asc' },
  });

  // Get PR data grouped by week
  const prs = await prisma.pullRequestData.findMany({
    where: {
      tenantId,
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group data by week
  const weeklyData: Map<string, HistoricalDataPoint> = new Map();

  for (const release of releases) {
    const weekKey = getWeekKey(release.deploymentDate);
    const existing = weeklyData.get(weekKey) || createEmptyDataPoint(release.deploymentDate);
    
    existing.riskIndex = Math.max(existing.riskIndex, release.releaseRiskIndex);
    existing.engineeringScore = (existing.engineeringScore + release.engineeringScore * 100) / 2;
    existing.userJourneyScore = (existing.userJourneyScore + release.userJourneyScore) / 2;
    existing.incidentCount += release.risks.length;
    
    weeklyData.set(weekKey, existing);
  }

  // Add build metrics
  for (const build of builds) {
    if (!build.startedAt) continue;
    const weekKey = getWeekKey(build.startedAt);
    const existing = weeklyData.get(weekKey) || createEmptyDataPoint(build.startedAt);
    
    existing.deploymentFrequency++;
    if (build.status === 'failure') {
      existing.failedBuildRate = (existing.failedBuildRate * existing.deploymentFrequency + 1) / (existing.deploymentFrequency);
    }
    
    weeklyData.set(weekKey, existing);
  }

  // Add PR metrics
  for (const pr of prs) {
    const weekKey = getWeekKey(pr.createdAt);
    const existing = weeklyData.get(weekKey) || createEmptyDataPoint(pr.createdAt);
    
    existing.prSize += pr.linesAdded + pr.linesDeleted;
    
    weeklyData.set(weekKey, existing);
  }

  return Array.from(weeklyData.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function createEmptyDataPoint(date: Date): HistoricalDataPoint {
  return {
    date: new Date(date),
    riskIndex: 0,
    engineeringScore: 0,
    userJourneyScore: 0,
    prSize: 0,
    deploymentFrequency: 0,
    failedBuildRate: 0,
    incidentCount: 0,
  };
}

// ============================================
// Prediction Functions
// ============================================

/**
 * Generate risk forecasts for the next N weeks
 */
export async function generateRiskForecast(
  tenantId: string,
  weeksAhead: number = 4
): Promise<PredictionResult> {
  // Fetch historical data (12 weeks for better prediction)
  const historicalData = await fetchHistoricalData(tenantId, 12);
  
  if (historicalData.length < 3) {
    // Not enough data for prediction
    return {
      currentRiskIndex: 0,
      currentTrend: 'STABLE',
      trendStrength: 0,
      forecasts: [],
      insights: ['Insufficient historical data for prediction. Need at least 3 weeks of data.'],
      recommendations: ['Continue collecting data to enable risk forecasting.'],
      stabilityDecayCurve: [],
      confidenceScore: 0,
    };
  }

  // Extract time series
  const riskIndices = historicalData.map(d => d.riskIndex);
  const engineeringScores = historicalData.map(d => d.engineeringScore);
  const deploymentFreqs = historicalData.map(d => d.deploymentFrequency);
  const prSizes = historicalData.map(d => d.prSize);

  // Calculate current state
  const currentRiskIndex = riskIndices[riskIndices.length - 1] || 0;
  const { direction: currentTrend, strength: trendStrength } = calculateTrend(riskIndices);

  // Linear regression for risk index prediction
  const x = riskIndices.map((_, i) => i);
  const { slope, intercept, r2 } = linearRegression(x, riskIndices);

  // Generate forecasts
  const forecasts: RiskForecast[] = [];
  const stdDev = standardDeviation(riskIndices);
  const baseDate = new Date();

  for (let i = 1; i <= weeksAhead; i++) {
    const futureDate = new Date(baseDate);
    futureDate.setDate(futureDate.getDate() + i * 7);

    const predictedValue = slope * (riskIndices.length + i - 1) + intercept;
    const clampedPrediction = Math.max(0, Math.min(100, predictedValue));

    // Confidence interval widens with time
    const uncertaintyFactor = 1 + (i * 0.15);
    const confidenceMargin = stdDev * uncertaintyFactor * 1.96; // 95% CI

    // Calculate probability of high risk (>50)
    const zScore = (50 - clampedPrediction) / Math.max(stdDev, 1);
    const probability = 1 - normalCDF(zScore);

    forecasts.push({
      date: futureDate.toISOString().split('T')[0],
      predictedRiskIndex: Math.round(clampedPrediction * 10) / 10,
      confidenceInterval: {
        lower: Math.max(0, Math.round((clampedPrediction - confidenceMargin) * 10) / 10),
        upper: Math.min(100, Math.round((clampedPrediction + confidenceMargin) * 10) / 10),
      },
      riskLevel: getRiskLevel(clampedPrediction),
      probability: Math.round(probability * 100) / 100,
    });
  }

  // Generate stability decay curve (assuming current patterns continue)
  const stabilityDecayCurve = [];
  for (let week = 1; week <= 8; week++) {
    const predictedScore = Math.max(0, Math.min(100, 
      engineeringScores[engineeringScores.length - 1] - (slope > 0 ? week * 2 : week * -0.5)
    ));
    stabilityDecayCurve.push({ week, predictedScore: Math.round(predictedScore * 10) / 10 });
  }

  // Generate insights
  const insights = generatePredictiveInsights(historicalData, forecasts, currentTrend, slope);
  const recommendations = generateRecommendations(historicalData, forecasts, currentTrend);

  // Confidence score based on R² and data points
  const confidenceScore = Math.min(0.95, r2 * 0.6 + Math.min(historicalData.length / 12, 1) * 0.4);

  return {
    currentRiskIndex: Math.round(currentRiskIndex * 10) / 10,
    currentTrend,
    trendStrength: Math.round(trendStrength * 100) / 100,
    forecasts,
    insights,
    recommendations,
    stabilityDecayCurve,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
  };
}

/**
 * Normal CDF approximation for probability calculation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Generate predictive insights based on data
 */
function generatePredictiveInsights(
  historicalData: HistoricalDataPoint[],
  forecasts: RiskForecast[],
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING',
  slope: number
): string[] {
  const insights: string[] = [];

  // Trend insight
  if (trend === 'WORSENING') {
    insights.push(`Risk index is trending upward at approximately ${Math.abs(slope).toFixed(1)} points per week.`);
  } else if (trend === 'IMPROVING') {
    insights.push(`Risk index is trending downward at approximately ${Math.abs(slope).toFixed(1)} points per week.`);
  } else {
    insights.push('Risk index has been relatively stable over the past weeks.');
  }

  // High risk probability
  const highRiskWeek = forecasts.find(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL');
  if (highRiskWeek) {
    insights.push(`High-risk threshold may be reached around ${highRiskWeek.date} with ${Math.round(highRiskWeek.probability * 100)}% probability.`);
  }

  // Deployment frequency correlation
  const avgDeployments = historicalData.reduce((sum, d) => sum + d.deploymentFrequency, 0) / historicalData.length;
  if (avgDeployments > 5) {
    insights.push(`High deployment frequency (${avgDeployments.toFixed(1)}/week) may be contributing to elevated risk.`);
  }

  // PR size insight
  const avgPrSize = historicalData.reduce((sum, d) => sum + d.prSize, 0) / historicalData.length;
  if (avgPrSize > 1000) {
    insights.push(`Large average PR size (${Math.round(avgPrSize)} LOC) correlates with higher risk exposure.`);
  }

  return insights;
}

/**
 * Generate recommendations based on prediction
 */
function generateRecommendations(
  historicalData: HistoricalDataPoint[],
  forecasts: RiskForecast[],
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING'
): string[] {
  const recommendations: string[] = [];

  if (trend === 'WORSENING') {
    recommendations.push('Consider reducing deployment frequency to stabilize the system.');
    recommendations.push('Review and address high-severity risks before the next release.');
  }

  const avgFailedBuildRate = historicalData.reduce((sum, d) => sum + d.failedBuildRate, 0) / historicalData.length;
  if (avgFailedBuildRate > 0.2) {
    recommendations.push(`Improve CI/CD pipeline stability. Current failed build rate is ${Math.round(avgFailedBuildRate * 100)}%.`);
  }

  const avgPrSize = historicalData.reduce((sum, d) => sum + d.prSize, 0) / historicalData.length;
  if (avgPrSize > 800) {
    recommendations.push('Break down large PRs into smaller, focused changes to reduce risk.');
  }

  const upcomingHighRisk = forecasts.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL');
  if (upcomingHighRisk.length > 0) {
    recommendations.push(`Plan stabilization sprint before ${upcomingHighRisk[0].date} to mitigate predicted risk increase.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Current metrics are within acceptable ranges. Continue monitoring.');
  }

  return recommendations;
}

// ============================================
// Scenario Simulation (What-If Analysis)
// ============================================

/**
 * Simulate scenario: "What if deployment frequency increases by X%?"
 */
export async function simulateScenario(
  tenantId: string,
  scenario: ScenarioInput
): Promise<ScenarioResult> {
  const historicalData = await fetchHistoricalData(tenantId, 8);
  
  if (historicalData.length === 0) {
    return {
      baselineRiskIndex: 0,
      predictedRiskIndex: 0,
      riskChange: 0,
      riskChangePercent: 0,
      newRiskLevel: 'LOW',
      explanation: 'Insufficient data for scenario simulation.',
    };
  }

  // Current baseline
  const latest = historicalData[historicalData.length - 1];
  const baselineRiskIndex = latest.riskIndex || 30; // Default if no data

  // Calculate impact factors based on correlations
  // These weights are derived from typical software engineering patterns
  const deploymentImpact = scenario.deploymentFrequencyChange * 15; // +20% deployment -> +3 risk points
  const prSizeImpact = scenario.prSizeChange * 20; // +20% PR size -> +4 risk points
  const testCoverageImpact = scenario.testCoverageChange * -25; // +20% coverage -> -5 risk points (improves)

  const totalImpact = deploymentImpact + prSizeImpact + testCoverageImpact;
  const predictedRiskIndex = Math.max(0, Math.min(100, baselineRiskIndex + totalImpact));

  const riskChange = predictedRiskIndex - baselineRiskIndex;
  const riskChangePercent = baselineRiskIndex > 0 ? (riskChange / baselineRiskIndex) * 100 : 0;

  // Generate explanation
  const parts: string[] = [];
  if (scenario.deploymentFrequencyChange !== 0) {
    const direction = scenario.deploymentFrequencyChange > 0 ? 'increases' : 'decreases';
    parts.push(`deployment frequency ${direction} by ${Math.abs(scenario.deploymentFrequencyChange * 100).toFixed(0)}%`);
  }
  if (scenario.prSizeChange !== 0) {
    const direction = scenario.prSizeChange > 0 ? 'increases' : 'decreases';
    parts.push(`PR size ${direction} by ${Math.abs(scenario.prSizeChange * 100).toFixed(0)}%`);
  }
  if (scenario.testCoverageChange !== 0) {
    const direction = scenario.testCoverageChange > 0 ? 'increases' : 'decreases';
    parts.push(`test coverage ${direction} by ${Math.abs(scenario.testCoverageChange * 100).toFixed(0)}%`);
  }

  const explanation = parts.length > 0
    ? `If ${parts.join(' and ')}, risk index is predicted to ${riskChange >= 0 ? 'increase' : 'decrease'} from ${baselineRiskIndex.toFixed(1)} to ${predictedRiskIndex.toFixed(1)} (${riskChange >= 0 ? '+' : ''}${riskChange.toFixed(1)} points).`
    : 'No changes specified for simulation.';

  return {
    baselineRiskIndex: Math.round(baselineRiskIndex * 10) / 10,
    predictedRiskIndex: Math.round(predictedRiskIndex * 10) / 10,
    riskChange: Math.round(riskChange * 10) / 10,
    riskChangePercent: Math.round(riskChangePercent * 10) / 10,
    newRiskLevel: getRiskLevel(predictedRiskIndex),
    explanation,
  };
}

// ============================================
// Model Storage (for persistence)
// ============================================

export interface StoredPrediction {
  id?: string;
  tenantId: string;
  predictionType: 'WEEKLY_FORECAST' | 'SCENARIO_SIMULATION';
  forecastData: PredictionResult | ScenarioResult;
  calculatedAt: Date;
  validUntil: Date;
}

/**
 * Save prediction to database for caching
 */
export async function savePrediction(
  tenantId: string,
  predictionType: 'WEEKLY_FORECAST' | 'SCENARIO_SIMULATION',
  data: PredictionResult | ScenarioResult
): Promise<void> {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 1); // Valid for 24 hours

  await prisma.riskPrediction.upsert({
    where: {
      tenantId_predictionType: {
        tenantId,
        predictionType,
      },
    },
    create: {
      tenantId,
      predictionType,
      forecastData: data as any,
      validUntil,
    },
    update: {
      forecastData: data as any,
      calculatedAt: new Date(),
      validUntil,
    },
  });
}

/**
 * Get cached prediction if still valid
 */
export async function getCachedPrediction(
  tenantId: string,
  predictionType: 'WEEKLY_FORECAST' | 'SCENARIO_SIMULATION'
): Promise<PredictionResult | ScenarioResult | null> {
  const prediction = await prisma.riskPrediction.findUnique({
    where: {
      tenantId_predictionType: {
        tenantId,
        predictionType,
      },
    },
  });

  if (!prediction || new Date() > prediction.validUntil) {
    return null;
  }

  return prediction.forecastData as unknown as PredictionResult | ScenarioResult;
}
