import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { IProcessCommunicationsGateway } from '../../gateways/contracts/process-communications-gateway';
import type { IProcessSyncRepository } from '../../repository/contracts/process-sync-repository';
import type { ProcessSyncInput } from '../../types/process-sync-input.type';
import { UpdateProcessesUseCase } from '../../use-cases/update-processes-usecase';

function makeSyncInput(overrides: Partial<{ externalId: number }> = {}): ProcessSyncInput {
  return {
    process: {
      processNumber: `0000000-00.2026.5.10.${String(overrides.externalId ?? 1).padStart(4, '0')}`,
      courtAcronym: 'TRT10',
      organName: '18ª Vara',
      hasFinalJudgment: false,
    },
    communication: {
      externalId: overrides.externalId ?? 1,
      publicationDate: new Date('2026-04-10'),
      communicationType: 'Intimação',
      content: 'texto',
      source: null,
    },
    recipients: [],
  };
}

function mockStreamReturning(...batches: ProcessSyncInput[][]) {
  return () => {
    async function* gen() {
      for (const batch of batches) {
        yield batch;
      }
    }
    return gen();
  };
}

function mockEmptyStream() {
  return () => {
    async function* gen(): AsyncGenerator<ProcessSyncInput[]> {
      // yields nothing
    }
    return gen();
  };
}

function mockThrowingStream(error: Error) {
  return () => {
    // biome-ignore lint/correctness/useYield: test mock that throws before yielding
    async function* gen(): AsyncGenerator<ProcessSyncInput[]> {
      throw error;
    }
    return gen();
  };
}

describe('UpdateProcessesUseCase', () => {
  let streamCommunications: Mock;
  let persistCommunication: Mock;
  let useCase: UpdateProcessesUseCase;

  beforeEach(() => {
    streamCommunications = vi.fn();
    persistCommunication = vi.fn();

    const gateway: IProcessCommunicationsGateway = { streamCommunications };
    const repository: IProcessSyncRepository = { persistCommunication };

    useCase = new UpdateProcessesUseCase(gateway, repository);
  });

  it('returns referenceDate as yesterday in YYYY-MM-DD format (UTC)', async () => {
    streamCommunications.mockImplementation(mockEmptyStream());

    const summary = await useCase.execute();

    const expected = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 1),
    )
      .toISOString()
      .slice(0, 10);

    expect(summary.referenceDate).toBe(expected);
  });

  it('aggregates totals from a single batch with all items created', async () => {
    const items = [makeSyncInput({ externalId: 1 }), makeSyncInput({ externalId: 2 })];
    streamCommunications.mockImplementation(mockStreamReturning(items));
    persistCommunication.mockResolvedValue({ created: true });

    const summary = await useCase.execute();

    expect(summary.totalFetched).toBe(2 * 3);
    expect(summary.totalCreated).toBe(2 * 3);
    expect(summary.totalSkipped).toBe(0);
    expect(summary.totalFailed).toBe(0);
  });

  it('counts skipped when persistCommunication returns created=false', async () => {
    const items = [makeSyncInput({ externalId: 1 }), makeSyncInput({ externalId: 2 })];
    streamCommunications.mockImplementation(mockStreamReturning(items));
    persistCommunication
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: false })
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: false })
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: false });

    const summary = await useCase.execute();

    expect(summary.totalCreated).toBe(3);
    expect(summary.totalSkipped).toBe(3);
  });

  it('aggregates across multiple batches from the gateway', async () => {
    const batch1 = [makeSyncInput({ externalId: 1 })];
    const batch2 = [makeSyncInput({ externalId: 2 }), makeSyncInput({ externalId: 3 })];
    streamCommunications.mockImplementation(mockStreamReturning(batch1, batch2));
    persistCommunication.mockResolvedValue({ created: true });

    const summary = await useCase.execute();

    expect(summary.totalFetched).toBe(3 * 3);
    expect(summary.totalCreated).toBe(3 * 3);
  });

  it('increments failed counter but keeps processing when persistCommunication throws', async () => {
    const items = [
      makeSyncInput({ externalId: 1 }),
      makeSyncInput({ externalId: 2 }),
      makeSyncInput({ externalId: 3 }),
    ];
    streamCommunications.mockImplementation(mockStreamReturning(items));
    persistCommunication
      .mockResolvedValueOnce({ created: true })
      .mockRejectedValueOnce(new Error('DB constraint'))
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: true })
      .mockRejectedValueOnce(new Error('DB constraint'))
      .mockResolvedValueOnce({ created: true })
      .mockResolvedValueOnce({ created: true })
      .mockRejectedValueOnce(new Error('DB constraint'))
      .mockResolvedValueOnce({ created: true });

    const summary = await useCase.execute();

    expect(summary.totalCreated).toBe(6);
    expect(summary.totalFailed).toBe(3);
    expect(summary.totalSkipped).toBe(0);
    expect(persistCommunication).toHaveBeenCalledTimes(9);
  });

  it('isolates organ-level failures: other organs are still processed', async () => {
    let callCount = 0;
    streamCommunications.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return mockThrowingStream(new Error('API down for TRT10'))();
      }
      return mockStreamReturning([makeSyncInput({ externalId: 10 })])();
    });
    persistCommunication.mockResolvedValue({ created: true });

    const summary = await useCase.execute();

    expect(summary.perOrgan[0].fetched).toBe(0);
    expect(summary.perOrgan[1].fetched).toBe(1);
    expect(summary.perOrgan[2].fetched).toBe(1);
    expect(summary.totalCreated).toBe(2);
  });

  it('populates perOrgan entries with matching label, siglaTribunal and orgaoId', async () => {
    streamCommunications.mockImplementation(mockEmptyStream());

    const summary = await useCase.execute();

    expect(summary.perOrgan).toHaveLength(3);
    expect(summary.perOrgan[0].siglaTribunal).toBe('TRT10');
    expect(summary.perOrgan[1].siglaTribunal).toBe('TJTO');
    expect(summary.perOrgan[2].siglaTribunal).toBe('TJRS');
  });

  it('returns zero totals when the gateway yields no items', async () => {
    streamCommunications.mockImplementation(mockEmptyStream());

    const summary = await useCase.execute();

    expect(summary.totalFetched).toBe(0);
    expect(summary.totalCreated).toBe(0);
    expect(summary.totalSkipped).toBe(0);
    expect(summary.totalFailed).toBe(0);
    expect(persistCommunication).not.toHaveBeenCalled();
  });
});
