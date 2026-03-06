-- CreateEnum
CREATE TYPE "GitProvider" AS ENUM ('GITHUB', 'GITLAB', 'BITBUCKET');

-- CreateEnum
CREATE TYPE "CICDProvider" AS ENUM ('GITHUB_ACTIONS', 'GITLAB_CI', 'JENKINS', 'CIRCLECI');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('PENDING', 'SYNCING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "CorrelationStrength" AS ENUM ('STRONG_POSITIVE', 'MODERATE_POSITIVE', 'WEAK_POSITIVE', 'NONE', 'WEAK_NEGATIVE', 'MODERATE_NEGATIVE', 'STRONG_NEGATIVE');

-- CreateTable
CREATE TABLE "GitIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "GitProvider" NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GitIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GitSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "status" "IntegrationStatus" NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GitSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CICDIntegration" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" "CICDProvider" NOT NULL,
    "projectId" TEXT,
    "accessToken" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "IntegrationStatus" NOT NULL DEFAULT 'PENDING',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CICDIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CICDSyncLog" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "recordsFound" INTEGER NOT NULL DEFAULT 0,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "status" "IntegrationStatus" NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CICDSyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequestData" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "linesAdded" INTEGER NOT NULL DEFAULT 0,
    "linesDeleted" INTEGER NOT NULL DEFAULT 0,
    "filesChanged" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "reviewDurationHrs" DOUBLE PRECISION,
    "mergedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequestData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildData" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "branch" TEXT,
    "commitSha" TEXT,
    "status" TEXT NOT NULL,
    "duration" INTEGER,
    "testsPassed" INTEGER,
    "testsFailed" INTEGER,
    "testCoverage" DOUBLE PRECISION,
    "triggeredBy" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskCorrelation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "signalA" TEXT NOT NULL,
    "signalB" TEXT NOT NULL,
    "correlation" DOUBLE PRECISION NOT NULL,
    "strength" "CorrelationStrength" NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "periodDays" INTEGER NOT NULL DEFAULT 30,
    "insight" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskCorrelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitIntegration_tenantId_key" ON "GitIntegration"("tenantId");

-- CreateIndex
CREATE INDEX "GitIntegration_tenantId_idx" ON "GitIntegration"("tenantId");

-- CreateIndex
CREATE INDEX "GitIntegration_provider_idx" ON "GitIntegration"("provider");

-- CreateIndex
CREATE INDEX "GitSyncLog_integrationId_idx" ON "GitSyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "GitSyncLog_syncType_idx" ON "GitSyncLog"("syncType");

-- CreateIndex
CREATE UNIQUE INDEX "CICDIntegration_tenantId_key" ON "CICDIntegration"("tenantId");

-- CreateIndex
CREATE INDEX "CICDIntegration_tenantId_idx" ON "CICDIntegration"("tenantId");

-- CreateIndex
CREATE INDEX "CICDIntegration_provider_idx" ON "CICDIntegration"("provider");

-- CreateIndex
CREATE INDEX "CICDSyncLog_integrationId_idx" ON "CICDSyncLog"("integrationId");

-- CreateIndex
CREATE INDEX "CICDSyncLog_syncType_idx" ON "CICDSyncLog"("syncType");

-- CreateIndex
CREATE INDEX "PullRequestData_tenantId_idx" ON "PullRequestData"("tenantId");

-- CreateIndex
CREATE INDEX "PullRequestData_tenantId_createdAt_idx" ON "PullRequestData"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequestData_tenantId_externalId_key" ON "PullRequestData"("tenantId", "externalId");

-- CreateIndex
CREATE INDEX "BuildData_tenantId_idx" ON "BuildData"("tenantId");

-- CreateIndex
CREATE INDEX "BuildData_tenantId_startedAt_idx" ON "BuildData"("tenantId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BuildData_tenantId_externalId_key" ON "BuildData"("tenantId", "externalId");

-- CreateIndex
CREATE INDEX "RiskCorrelation_tenantId_idx" ON "RiskCorrelation"("tenantId");

-- CreateIndex
CREATE INDEX "RiskCorrelation_strength_idx" ON "RiskCorrelation"("strength");

-- CreateIndex
CREATE UNIQUE INDEX "RiskCorrelation_tenantId_signalA_signalB_key" ON "RiskCorrelation"("tenantId", "signalA", "signalB");

-- AddForeignKey
ALTER TABLE "GitSyncLog" ADD CONSTRAINT "GitSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "GitIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CICDSyncLog" ADD CONSTRAINT "CICDSyncLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "CICDIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
