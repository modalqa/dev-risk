-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('WEEKLY_FORECAST', 'SCENARIO_SIMULATION');

-- CreateTable
CREATE TABLE "RiskPrediction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "predictionType" "PredictionType" NOT NULL,
    "forecastData" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskForecastHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "predictedRiskIndex" DOUBLE PRECISION NOT NULL,
    "actualRiskIndex" DOUBLE PRECISION,
    "confidenceLower" DOUBLE PRECISION NOT NULL,
    "confidenceUpper" DOUBLE PRECISION NOT NULL,
    "wasAccurate" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskForecastHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiskPrediction_tenantId_idx" ON "RiskPrediction"("tenantId");

-- CreateIndex
CREATE INDEX "RiskPrediction_validUntil_idx" ON "RiskPrediction"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "RiskPrediction_tenantId_predictionType_key" ON "RiskPrediction"("tenantId", "predictionType");

-- CreateIndex
CREATE INDEX "RiskForecastHistory_tenantId_idx" ON "RiskForecastHistory"("tenantId");

-- CreateIndex
CREATE INDEX "RiskForecastHistory_forecastDate_idx" ON "RiskForecastHistory"("forecastDate");

-- CreateIndex
CREATE INDEX "RiskForecastHistory_tenantId_forecastDate_idx" ON "RiskForecastHistory"("tenantId", "forecastDate");
