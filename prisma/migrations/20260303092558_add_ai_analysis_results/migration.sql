-- CreateTable
CREATE TABLE "AiAnalysisResult" (
    "id" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "riskPatterns" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "risksAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "risksUpdated" INTEGER NOT NULL DEFAULT 0,
    "beforeMetrics" JSONB NOT NULL,
    "afterMetrics" JSONB NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAnalysisResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiAnalysisResult_releaseId_idx" ON "AiAnalysisResult"("releaseId");

-- CreateIndex
CREATE INDEX "AiAnalysisResult_tenantId_idx" ON "AiAnalysisResult"("tenantId");

-- CreateIndex
CREATE INDEX "AiAnalysisResult_analysisType_idx" ON "AiAnalysisResult"("analysisType");

-- AddForeignKey
ALTER TABLE "AiAnalysisResult" ADD CONSTRAINT "AiAnalysisResult_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysisResult" ADD CONSTRAINT "AiAnalysisResult_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
