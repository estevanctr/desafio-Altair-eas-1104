import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type {
  UpdateProcessesSummary,
} from '../../use-cases/update-processes-usecase';
import { UpdateProcessesJob } from '../../jobs/update-processes.job';
import type { UpdateProcessesUseCase } from '../../use-cases/update-processes-usecase';


function makeSummary(
  overrides: Partial<UpdateProcessesSummary> = {},
): UpdateProcessesSummary {
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
  let job: UpdateProcessesJob;

  beforeEach(() => {
    execute = vi.fn();
    const useCase = { execute } as unknown as UpdateProcessesUseCase;
    job = new UpdateProcessesJob(useCase);
  });

  it('calls useCase.execute and completes without error on success', async () => {
    execute.mockResolvedValue(makeSummary());

    await expect(job.handleCron()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('does not propagate errors thrown by the use case (scheduler stays alive)', async () => {
    execute.mockRejectedValue(new Error('Catastrophic failure'));

    await expect(job.handleCron()).resolves.toBeUndefined();
    expect(execute).toHaveBeenCalledOnce();
  });
});
