import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type {
  IProcessRepository,
  PaginatedResult,
} from '../../repository/contracts/process-repository';
import type { ProcessWithLatestCommunicationType } from '../../types/process-with-latest-communication-type';
import {
  ListProcessesUseCase,
  PROCESSES_PAGE_SIZE,
} from '../../use-cases/list-processes-usecase';

describe('ListProcessesUseCase', () => {
  let listProcessesWithLatestCommunication: Mock;
  let findById: Mock;
  let listCommunicationsByProcess: Mock;
  let useCase: ListProcessesUseCase;

  beforeEach(() => {
    listProcessesWithLatestCommunication = vi.fn();
    findById = vi.fn();
    listCommunicationsByProcess = vi.fn();

    const processRepository: IProcessRepository = {
      listProcessesWithLatestCommunication,
      findById,
      listCommunicationsByProcess,
    };

    useCase = new ListProcessesUseCase(processRepository);
  });

  it('lists processes with their latest communication, applying the fixed page size', async () => {
    const publicationDate = new Date('2026-04-10T12:00:00Z');
    const repositoryResult: PaginatedResult<ProcessWithLatestCommunicationType> =
      {
        items: [
          {
            id: 'process-1',
            processNumber: '0001-23',
            courtAcronym: 'TJSP',
            organName: 'Vara 1',
            communicationType: 'INTIMACAO',
            publicationDate,
            content: 'Texto',
            aiSummary: 'Resumo',
            recipientNames: 'Alice, Bob',
          },
        ],
        total: 1,
        page: 1,
        pageSize: PROCESSES_PAGE_SIZE,
      };
    listProcessesWithLatestCommunication.mockResolvedValue(repositoryResult);

    const filters = {
      page: 1,
      courtAcronym: 'TJSP',
      processNumber: '0001-23',
      publicationDateFrom: new Date('2026-04-01T00:00:00Z'),
      publicationDateTo: new Date('2026-04-30T23:59:59Z'),
    };

    const result = await useCase.execute(filters);

    expect(listProcessesWithLatestCommunication).toHaveBeenCalledWith(
      filters,
      PROCESSES_PAGE_SIZE,
    );
    expect(result.items).toEqual([
      {
        id: 'process-1',
        processNumber: '0001-23',
        courtAcronym: 'TJSP',
        organName: 'Vara 1',
        latestCommunication: {
          communicationType: 'INTIMACAO',
          publicationDate,
          content: 'Texto',
          aiSummary: 'Resumo',
          recipients: ['Alice', 'Bob'],
        },
      },
    ]);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(PROCESSES_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
  });

  it('returns an empty list with zero pages when the repository has no matches', async () => {
    listProcessesWithLatestCommunication.mockResolvedValue({
      items: [],
      total: 0,
      page: 2,
      pageSize: PROCESSES_PAGE_SIZE,
    });

    const result = await useCase.execute({ page: 2 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
