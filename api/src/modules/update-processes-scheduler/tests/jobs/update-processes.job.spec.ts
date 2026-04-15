import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { CronRunStatus } from '../../../../../generated/prisma/client';
import type { ICronRunRepository } from '../../cron-logs/contracts/cron-run-repository';
import { UpdateProcessesJob } from '../../jobs/update-processes.job';
import type { UpdateProcessesSummary, UpdateProcessesUseCase } from '../../use-cases/update-processes-usecase';

function makeSummary(overrides: Partial<UpdateProcessesSummary> = {}): UpdateProcessesSummary {
  return {
    referenceDate: '2026-04-10',
    totalFetched: 5,
    totalCreated: 3,
    totalSkipped: 1,
    totalFailed: 1,
    perOrgan: [],
    ...overrides,
  };
}

describe('UpdateProcessesJob', () => {
  let execute: Mock;
  let recordRun: Mock;
  let job: UpdateProcessesJob;

  beforeEach(() => {
    execute = vi.fn();
    recordRun = vi.fn().mockResolvedValue(undefined);
    const useCase = { execute } as unknown as UpdateProcessesUseCase;
    const cronRunRepository: ICronRunRepository = { recordRun };
    job = new UpdateProcessesJob(useCase, cronRunRepository);
  });

  it('calls useCase.execute and completes without error on success', async () => {
    execute.mockResolvedValue(makeSummary({ totalFailed: 0, perOrgan: [] }));

    await expect(job.handleCron()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('does not propagate errors thrown by the use case (scheduler stays alive)', async () => {
    execute.mockRejectedValue(new Error('Catastrophic failure'));

    await expect(job.handleCron()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('persists a SUCCESS cron run log when summary has no failures', async () => {
    execute.mockResolvedValue(
      makeSummary({
        totalFailed: 0,
        perOrgan: [
          {
            label: 'TRT10',
            siglaTribunal: 'TRT10',
            orgaoId: 46612,
            fetched: 5,
            created: 3,
            skipped: 2,
            failed: 0,
          },
        ],
      }),
    );

    await job.handleCron();

    expect(recordRun).toHaveBeenCalledOnce();
    const record = recordRun.mock.calls[0][0];
    expect(record.status).toBe(CronRunStatus.SUCCESS);
    expect(record.fetched).toBe(5);
    expect(record.organs).toHaveLength(1);
    expect(record.organs[0]).toMatchObject({
      label: 'TRT10',
      courtAcronym: 'TRT10',
      organId: 46612,
      errorMessage: null,
    });
    expect(record.errorMessage).toBeNull();
  });

  it('persists a PARTIAL_FAILURE cron run log when summary has per-item failures', async () => {
    execute.mockResolvedValue(
      makeSummary({
        totalFailed: 2,
        perOrgan: [],
      }),
    );

    await job.handleCron();

    const record = recordRun.mock.calls[0][0];
    expect(record.status).toBe(CronRunStatus.PARTIAL_FAILURE);
    expect(record.failed).toBe(2);
  });

  it('persists a PARTIAL_FAILURE cron run log when an organ-level error is present', async () => {
    execute.mockResolvedValue(
      makeSummary({
        totalFailed: 0,
        perOrgan: [
          {
            label: 'TRT10',
            siglaTribunal: 'TRT10',
            orgaoId: 46612,
            fetched: 0,
            created: 0,
            skipped: 0,
            failed: 0,
            error: 'API down',
          },
        ],
      }),
    );

    await job.handleCron();

    const record = recordRun.mock.calls[0][0];
    expect(record.status).toBe(CronRunStatus.PARTIAL_FAILURE);
    expect(record.organs[0].errorMessage).toBe('API down');
  });

  it('persists a FAILED cron run log when the use case throws', async () => {
    execute.mockRejectedValue(new Error('Catastrophic failure'));

    await job.handleCron();

    expect(recordRun).toHaveBeenCalledOnce();
    const record = recordRun.mock.calls[0][0];
    expect(record.status).toBe(CronRunStatus.FAILED);
    expect(record.errorMessage).toBe('Catastrophic failure');
    expect(record.organs).toEqual([]);
  });

  it('swallows errors from cronRunRepository so the scheduler stays alive', async () => {
    execute.mockResolvedValue(makeSummary({ totalFailed: 0, perOrgan: [] }));
    recordRun.mockRejectedValue(new Error('DB down'));

    await expect(job.handleCron()).resolves.toBeUndefined();
  });
});
