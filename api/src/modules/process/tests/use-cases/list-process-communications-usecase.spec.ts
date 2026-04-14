import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { IProcessRepository, PaginatedResult } from '../../repository/contracts/process-repository';
import type { CommunicationType } from '../../types/communication-type';
import type { ProcessType } from '../../types/process-type';
import {
  COMMUNICATIONS_PAGE_SIZE,
  ListProcessCommunicationsUseCase,
} from '../../use-cases/list-process-communications-usecase';

describe('ListProcessCommunicationsUseCase', () => {
  let listProcessesWithLatestCommunication: Mock;
  let findById: Mock;
  let listCommunicationsByProcess: Mock;
  let useCase: ListProcessCommunicationsUseCase;

  const existingProcess: ProcessType = {
    id: 'process-1',
    processNumber: '0001-23',
    courtAcronym: 'TJSP',
    organName: 'Vara 1',
    hasFinalJudgment: false,
    createdAt: new Date('2026-04-01T00:00:00Z'),
    updatedAt: new Date('2026-04-10T00:00:00Z'),
  };

  beforeEach(() => {
    listProcessesWithLatestCommunication = vi.fn();
    findById = vi.fn();
    listCommunicationsByProcess = vi.fn();

    const processRepository: IProcessRepository = {
      listProcessesWithLatestCommunication,
      findById,
      listCommunicationsByProcess,
      findCommunicationById: vi.fn(),
      updateCommunicationAiSummary: vi.fn(),
    };

    useCase = new ListProcessCommunicationsUseCase(processRepository);
  });

  it('returns paginated communications with total count when the process exists', async () => {
    const publicationDate = new Date('2026-04-10T12:00:00Z');
    const repositoryResult: PaginatedResult<CommunicationType> = {
      items: [
        {
          id: 'comm-1',
          externalId: 100,
          publicationDate,
          communicationType: 'INTIMACAO',
          content: 'Texto',
          source: 'DJE',
          aiSummary: null,
          processId: existingProcess.id,
          createdAt: new Date('2026-04-10T12:00:00Z'),
          recipients: [
            {
              id: 'rec-1',
              name: 'Alice',
              role: 'ADVOGADO',
              oabNumber: '123',
              oabState: 'SP',
              isLawyer: true,
            },
          ],
        },
      ],
      total: 5,
      page: 1,
      pageSize: COMMUNICATIONS_PAGE_SIZE,
    };
    findById.mockResolvedValue(existingProcess);
    listCommunicationsByProcess.mockResolvedValue(repositoryResult);

    const result = await useCase.execute({
      processId: existingProcess.id,
      page: 1,
    });

    expect(findById).toHaveBeenCalledWith(existingProcess.id);
    expect(listCommunicationsByProcess).toHaveBeenCalledWith(
      { processId: existingProcess.id, page: 1 },
      COMMUNICATIONS_PAGE_SIZE,
    );
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(COMMUNICATIONS_PAGE_SIZE);
    expect(result.totalPages).toBe(1);
    expect(result.process).toEqual({
      id: existingProcess.id,
      processNumber: existingProcess.processNumber,
      courtAcronym: existingProcess.courtAcronym,
      organName: existingProcess.organName,
      hasFinalJudgment: existingProcess.hasFinalJudgment,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 'comm-1',
      externalId: 100,
      publicationDate,
      communicationType: 'INTIMACAO',
      content: 'Texto',
      source: 'DJE',
      aiSummary: null,
    });
    expect(result.items[0].recipients).toEqual([
      {
        id: 'rec-1',
        name: 'Alice',
        role: 'ADVOGADO',
        oabNumber: '123',
        oabState: 'SP',
        isLawyer: true,
      },
    ]);
  });

  it('throws NotFoundException when the process does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(useCase.execute({ processId: 'missing', page: 1 })).rejects.toBeInstanceOf(NotFoundException);

    expect(listCommunicationsByProcess).not.toHaveBeenCalled();
  });
});
