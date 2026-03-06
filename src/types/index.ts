// ============================================
// Shared TypeScript types for DevRisk AI
// ============================================

export type UserRole = 'OWNER' | 'ADMIN' | 'VIEWER';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED';
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskCategory = 'ENGINEERING' | 'USER_JOURNEY' | 'RELEASE_PROCESS' | 'SECURITY' | 'PERFORMANCE';
export type RiskStatus = 'OPEN' | 'IN_PROGRESS' | 'MITIGATED' | 'CLOSED';
export type ReleaseStatus = 'PENDING' | 'DEPLOYED' | 'ROLLED_BACK' | 'CANCELLED';
export type AiProviderType = 'OPENAI' | 'GEMINI' | 'OLLAMA';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number; risks: number; releases: number };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
}

export interface Risk {
  id: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  score: number;
  status: RiskStatus;
  tenantId: string;
  releaseId?: string | null;
  release?: { version: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Release {
  id: string;
  version: string;
  description?: string | null;
  engineeringScore: number;
  userJourneyScore: number;
  releaseRiskIndex: number;
  deploymentDate: string;
  status: ReleaseStatus;
  prSize?: number | null;
  reviewDurationHours?: number | null;
  failedBuildRate?: number | null;
  testCoverage?: number | null;
  deploymentsPerWeek?: number | null;
  reopenedIssues?: number | null;
  tenantId: string;
  risks?: Risk[];
  createdAt: string;
  updatedAt: string;
}

export interface UserJourneyFlow {
  id: string;
  name: string;
  dropoffRate: number;
  incidentCount: number;
  stabilityScore: number;
  tenantId: string;
}

export interface AiProvider {
  id: string;
  name: string;
  type: AiProviderType;
  displayName: string;
  isActive: boolean;
  apiKey?: string | null;
  baseUrl?: string | null;
  model: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  releaseRiskIndex: number;
  engineeringScore: number;
  userJourneyScore: number;
  activeReleasesCount: number;
  openRisksCount: number;
  criticalRisksCount: number;
  riskTrend: TrendPoint[];
  highRiskReleases: Release[];
  recentRisks: Risk[];
}

export interface TrendPoint {
  date: string;
  riskIndex: number;
  engineeringScore: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
