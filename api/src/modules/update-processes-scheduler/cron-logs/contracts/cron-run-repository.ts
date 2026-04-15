import type { CronRunStatus } from '../../../../../generated/prisma/client';

export type CronRunOrganRecord = {
  label: string;
  courtAcronym: string;
  organId: number;
  fetched: number;
  created: number;
  skipped: number;
  failed: number;
  errorMessage?: string | null;
};

export type CronRunRecord = {
  jobName: string;
  referenceDate: string;
  startedAt: Date;
  finishedAt: Date;
  durationMs: number;
  status: CronRunStatus;
  fetched: number;
  created: number;
  skipped: number;
  failed: number;
  errorMessage?: string | null;
  organs: CronRunOrganRecord[];
};

export interface ICronRunRepository {
  recordRun(input: CronRunRecord): Promise<void>;
}
