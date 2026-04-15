-- CreateEnum
CREATE TYPE "CommunicationSource" AS ENUM ('DIARIO', 'EDITAL');

-- CreateEnum
CREATE TYPE "CronRunStatus" AS ENUM ('SUCCESS', 'PARTIAL_FAILURE', 'FAILED');

-- AlterTable: backfill source column to enum
ALTER TABLE "communications" ADD COLUMN "source_new" "CommunicationSource";

UPDATE "communications"
SET "source_new" = CASE
    WHEN "source" = 'D' THEN 'DIARIO'::"CommunicationSource"
    WHEN "source" = 'E' THEN 'EDITAL'::"CommunicationSource"
    ELSE NULL
END;

ALTER TABLE "communications" DROP COLUMN "source";
ALTER TABLE "communications" RENAME COLUMN "source_new" TO "source";

-- CreateTable
CREATE TABLE "cron_runs" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "referenceDate" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "status" "CronRunStatus" NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_run_organs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "courtAcronym" TEXT NOT NULL,
    "organId" INTEGER NOT NULL,
    "fetched" INTEGER NOT NULL DEFAULT 0,
    "created" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "cron_run_organs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cron_runs_jobName_startedAt_idx" ON "cron_runs"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "cron_runs_status_idx" ON "cron_runs"("status");

-- CreateIndex
CREATE INDEX "cron_run_organs_runId_idx" ON "cron_run_organs"("runId");

-- AddForeignKey
ALTER TABLE "cron_run_organs" ADD CONSTRAINT "cron_run_organs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "cron_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
