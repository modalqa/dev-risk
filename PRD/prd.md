Product Requirements Document (PRD)
===================================

DevRisk AI
==========

AI Risk Intelligence for Scaling Product Teams
----------------------------------------------

* * * * *

1\. Product Overview
====================

1.1 Vision
----------

DevRisk AI adalah AI-powered Executive Risk Intelligence Platform yang membantu CTO, VP Engineering, Head of Product, dan Founder memahami risiko engineering dan user impact sebelum dan sesudah release.

Platform ini bukan monitoring tool dan bukan enterprise GRC, melainkan strategic AI layer di atas engineering & product data.

* * * * *

2\. Problem Statement
=====================

Scaling product teams sering menghadapi masalah:

-   Sprint velocity meningkat → stability menurun

-   Release cepat → regression meningkat

-   Engineering risk tidak terlihat di level executive

-   User impact baru terlihat setelah incident terjadi

Saat ini data tersebar di:

-   Git repository

-   CI/CD

-   Issue tracker

-   Testing tools

-   Product analytics

Tidak ada layer yang mengubah sinyal teknis menjadi business risk insight.

* * * * *

3\. Target Users (ICP)
======================

Primary Users:

-   CTO

-   VP Engineering

-   Head of Product

-   Founder

Secondary Users:

-   Engineering Manager

-   QA Lead

* * * * *

4\. Core Value Proposition
==========================

DevRisk AI membantu executive menjawab:

1.  Apakah release berikutnya berisiko tinggi?

2.  Apakah sprint velocity mulai mengorbankan stability?

3.  Modul mana yang menjadi risk hotspot?

4.  Apakah engineering risk berdampak ke user journey?

* * * * *

5\. Core Features (MVP)
=======================

5.1 Executive Risk Dashboard
----------------------------

Menampilkan:

-   Release Risk Index (0--100)

-   Engineering Stability Score

-   User Journey Stability Score

-   Risk Trend (30--90 hari)

-   High-Risk Release Candidates

* * * * *

5.2 Engineering Risk Analysis
-----------------------------

Data Sources:

-   PR size

-   Review duration

-   Deployment frequency

-   Test coverage

-   Failed builds

AI Analysis:

-   Risk correlation

-   Regression likelihood

-   Velocity vs stability tension

* * * * *

5.3 User Journey Risk Heatmap
-----------------------------

Menampilkan:

-   Risk per critical flow (Signup, Checkout, Payment, etc)

-   Drop-off correlation

-   Incident correlation

Output:

-   User Journey Stability Score

* * * * *

5.4 AI Risk Breakdown
---------------------

Untuk setiap release:

Menampilkan:

-   Root Cause Analysis

-   Affected User % (estimasi)

-   Release Correlation

-   Risk Projection (next 2--4 weeks)

* * * * *

5.5 Tenant & User Management
----------------------------

-   Multi-tenant architecture

-   Satu tenant = satu perusahaan

-   Satu tenant dapat memiliki banyak user

-   Role-based access (Owner, Admin, Viewer)

Tenant tidak bisa register sendiri.\
Tenant dibuat oleh Super Admin.

* * * * *

6\. Non-Goals (Phase 1)
=======================

-   Real-time monitoring engine

-   Heavy compliance module

-   Full enterprise GRC framework

-   Deep infrastructure observability

* * * * *

7\. Technical Architecture
==========================

7.1 Tech Stack
--------------

Frontend:

-   Next.js (App Router)

-   TypeScript

-   TailwindCSS

Backend:

-   Next.js API Routes (Node runtime)

-   TypeScript

Database:

-   PostgreSQL

-   Prisma ORM

Authentication:

-   JWT-based authentication

-   Role-based access control (RBAC)

Deployment:

-   Vercel / Self-hosted

-   PostgreSQL managed instance

* * * * *

8\. Multi-Tenant Architecture Design
====================================

8.1 Tenant Model
----------------

Each record MUST contain:

-   tenant_id (UUID)

All queries MUST be scoped by tenant_id.

* * * * *

8.2 Prisma Schema (Conceptual)
------------------------------

```
// =========================
// GENERATOR & DATASOURCE
// =========================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// =========================
// CORE TENANCY MODELS
// =========================

model Tenant {
  id           String    @id @default(uuid())
  name         String
  status       TenantStatus @default(ACTIVE)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  users        User[]
  risks        Risk[]
  releases     Release[]
  auditLogs    AuditLog[]

  @@index([status])
}

model User {
  id           String   @id @default(uuid())
  email        String
  passwordHash String
  role         UserRole
  isActive     Boolean  @default(true)

  tenantId     String
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([email, tenantId])
  @@index([tenantId])
}

model SuperAdmin {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

// =========================
// RISK & RELEASE MODELS
// =========================

model Risk {
  id            String   @id @default(uuid())
  title         String
  description   String
  category      RiskCategory
  severity      RiskSeverity
  score         Float

  tenantId      String
  tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  releaseId     String?
  release       Release? @relation(fields: [releaseId], references: [id], onDelete: SetNull)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([tenantId])
  @@index([releaseId])
  @@index([severity])
}

model Release {
  id                     String   @id @default(uuid())
  version                String
  engineeringScore       Float
  userJourneyScore       Float
  releaseRiskIndex       Float
  deploymentDate         DateTime

  tenantId               String
  tenant                 Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  risks                  Risk[]

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([version, tenantId])
  @@index([tenantId])
  @@index([deploymentDate])
}

// =========================
// AUDIT & TRACKING
// =========================

model AuditLog {
  id         String   @id @default(uuid())
  action     String
  entity     String
  entityId   String
  metadata   Json?

  tenantId   String
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())

  @@index([tenantId])
  @@index([entity, entityId])
}

// =========================
// ENUMS
// =========================

enum UserRole {
  OWNER
  ADMIN
  VIEWER
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
}

enum RiskSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum RiskCategory {
  ENGINEERING
  USER_JOURNEY
  RELEASE_PROCESS
  SECURITY
  PERFORMANCE
}

```

* * * * *

8.3 Data Isolation Strategy
---------------------------

### Application-Level Isolation

-   Middleware membaca JWT

-   Extract tenant_id

-   Semua query Prisma wajib include:

```
where: { tenantId: currentTenantId }

```

* * * * *

### Database-Level Protection (Recommended)

Gunakan PostgreSQL Row-Level Security (RLS):

-   Enable RLS pada setiap table

-   Policy berdasarkan tenant_id

Example concept:

```
CREATE POLICY tenant_isolation ON "Risk"
USING (tenant_id = current_setting('app.current_tenant')::uuid);

```

Set tenant context setiap request.

* * * * *

8.4 Super Admin Model
---------------------

Super Admin berada di global scope (tidak terkait tenant).

Responsibilities:

-   Create tenant

-   Assign tenant owner

-   Suspend tenant

-   View global metrics

Super Admin table terpisah:

```
model SuperAdmin {
  id       String @id @default(uuid())
  email    String @unique
  password String
}

```

* * * * *

9\. Security Requirements
=========================

-   Password hashing (bcrypt/argon2)

-   JWT expiration

-   Secure HTTP-only cookies

-   Strict RBAC validation

-   Audit log per tenant

* * * * *

10\. MVP Milestones
===================

Phase 1:

-   Multi-tenant auth

-   Executive dashboard UI

-   Manual risk input

-   AI analysis simulation

Phase 2:

-   Git integration

-   CI/CD integration

-   Risk correlation engine

Phase 3:

-   Predictive risk model

-   Release risk forecasting

* * * * *

11\. Success Metrics
====================

-   Monthly Active Tenants

-   Executive Weekly Usage

-   % Release Reviewed Before Deploy

-   Churn Rate

* * * * *

12\. Future Expansion
=====================

-   Scenario simulation ("What if sprint velocity +20%?")

-   Release readiness gate

-   Slack/Email executive brief

-   AI auto executive summary PDF

* * * * *

13\. Positioning Statement
==========================

DevRisk AI adalah AI Risk Intelligence layer untuk scaling product teams yang menerjemahkan engineering signals menjadi executive-level risk insight sebelum risiko berdampak ke user dan revenue.

* * * * *

14\. AI Risk Engine Design
==========================

14.1 Overview
-------------

AI Risk Engine adalah core intelligence layer dari DevRisk AI.

Engine ini bertugas untuk:

1.  Mengumpulkan engineering & product signals

2.  Melakukan risk scoring

3.  Melakukan correlation analysis

4.  Menghasilkan executive-level explanation

5.  Melakukan predictive projection

Engine dirancang modular dan dapat dikembangkan bertahap dari rule-based → hybrid → predictive ML.

* * * * *

14.2 Input Signals (Phase 1 - Structured Data)
----------------------------------------------

### Engineering Signals

-   PR size (lines changed)

-   Review duration

-   Deployment frequency

-   Failed build rate

-   Test coverage %

-   Reopened issues

### Release Signals

-   Time since last release

-   Number of high-severity risks

-   Hotfix frequency

### User Signals

-   Drop-off rate per journey

-   Incident count per flow

-   Regression reports

Semua signal disimpan per tenant dan diproses secara isolated.

* * * * *

14.3 Risk Scoring Architecture
------------------------------

### Layer 1: Signal Normalization

Setiap metric dinormalisasi ke skala 0--1.

Contoh:

normalizedPRSize = min(pr_size / threshold, 1)\
normalizedFailedBuild = failed_build_rate

* * * * *

### Layer 2: Weighted Risk Model (Phase 1)

Contoh formula awal:

Engineering Stability Score =\
(0.25 × test_coverage_weighted) +\
(0.20 × review_duration_weighted) +\
(0.20 × failed_build_inverse) +\
(0.15 × deployment_stability) +\
(0.20 × reopened_issue_inverse)

Release Risk Index =\
(1 - engineering_score) × 0.6 +\
(high_severity_risk_ratio × 0.4)

User Journey Stability Score =\
(1 - dropoff_risk_weighted) × 0.5 +\
(incident_ratio_inverse × 0.5)

Semua formula configurable per tenant di masa depan.

* * * * *

14.4 AI Explanation Layer
-------------------------

Setelah skor dihitung, AI layer menghasilkan:

-   Root Cause Analysis

-   Risk Drivers (Top 3 contributors)

-   Affected User % estimation

-   Release Correlation Insight

Contoh output:

"Release v2.3 menunjukkan peningkatan risk index 28% akibat penurunan test coverage pada module checkout dan peningkatan deployment frequency sebesar 35%. Estimasi user terdampak: 12--18%."

AI Explanation menggunakan:

-   Structured prompt template

-   Risk summary JSON

-   LLM reasoning layer

* * * * *

14.5 Risk Correlation Engine
----------------------------

Correlation Engine mendeteksi hubungan antar variabel:

Contoh:

-   PR size ↑ → Incident ↑

-   Sprint velocity ↑ → User drop-off ↑

-   Low review time → High regression risk

Metode Phase 1:

-   Statistical correlation (Pearson/Spearman)

-   Threshold-based anomaly detection

Phase 2:

-   Time-series regression

-   Predictive modeling

* * * * *

14.6 Predictive Risk Projection (Phase 2)
-----------------------------------------

Model memproyeksikan:

-   Risk trend 2--4 minggu ke depan

-   Probability of high-risk release

-   Stability decay curve

Output:

"Jika deployment frequency meningkat 20%, risk index diprediksi naik ke 78 dalam 2 sprint."

* * * * *

14.7 Isolation & Security in AI Engine
--------------------------------------

Setiap AI computation:

-   Scoped by tenant_id

-   Tidak pernah mencampur data antar tenant

-   Prompt AI hanya menerima aggregated data milik tenant tersebut

No cross-tenant memory.

* * * * *

14.8 Future AI Enhancements
---------------------------

-   Adaptive weight learning per tenant

-   Reinforcement learning dari incident feedback

-   Risk anomaly auto-alert

-   AI-generated executive PDF brief

14.9 UI Reference

- https://dribbble.com/shots/24937146-ORION-Job-Opportunities-SaaS

* * * * *

END OF PRD v2