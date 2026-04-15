import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { CommunicationSource } from '../../../../../generated/prisma/client';
import type { IAIDriver } from '../../../../drivers/ai/contracts/ai-driver';
import type { IProcessRepository } from '../../repository/contracts/process-repository';
import type { CommunicationType } from '../../types/communication-type';
import { SummarizeCommunicationUseCase } from '../../use-cases/summarize-communication-usecase';

describe('SummarizeCommunicationUseCase', () => {
  let findCommunicationById: Mock;
  let updateCommunicationAiSummary: Mock;
  let generateCompletion: Mock;
  let useCase: SummarizeCommunicationUseCase;

  const communicationId = '00000000-0000-0000-0000-000000000001';

  const baseCommunication: CommunicationType = {
    id: communicationId,
    externalId: 123,
    publicationDate: new Date('2026-04-10T12:00:00Z'),
    communicationType: 'INTIMACAO',
    content: 'Decisão determinando intimação da parte autora.',
    source: CommunicationSource.DIARIO,
    aiSummary: null,
    processId: 'process-1',
    createdAt: new Date('2026-04-10T12:00:00Z'),
    recipients: [
      {
        id: '00000000-0000-0000-0000-000000000002',
        name: 'Alice',
        role: 'ADVOGADO',
        oabNumber: '123',
        oabState: 'SP',
        isLawyer: true,
      },
    ],
  };

  beforeEach(() => {
    findCommunicationById = vi.fn();
    updateCommunicationAiSummary = vi.fn();
    generateCompletion = vi.fn();

    const processRepository: IProcessRepository = {
      listProcessesWithLatestCommunication: vi.fn(),
      findById: vi.fn(),
      listCommunicationsByProcess: vi.fn(),
      findCommunicationById,
      updateCommunicationAiSummary,
    };

    const aiDriver: IAIDriver = { generateCompletion };

    useCase = new SummarizeCommunicationUseCase(processRepository, aiDriver);
  });

  it('generates a summary via AI, persists it, and returns cached=false', async () => {
    findCommunicationById.mockResolvedValue(baseCommunication);
    generateCompletion.mockResolvedValue('Resumo gerado pela IA.');
    updateCommunicationAiSummary.mockResolvedValue({
      ...baseCommunication,
      aiSummary: 'Resumo gerado pela IA.',
    });

    const result = await useCase.execute(communicationId);

    expect(findCommunicationById).toHaveBeenCalledWith(communicationId);
    expect(generateCompletion).toHaveBeenCalledTimes(1);
    expect(updateCommunicationAiSummary).toHaveBeenCalledWith(communicationId, 'Resumo gerado pela IA.');
    expect(result).toEqual({
      id: communicationId,
      aiSummary: 'Resumo gerado pela IA.',
      cached: false,
    });
  });

  it('returns the cached summary without calling the AI when aiSummary already exists', async () => {
    findCommunicationById.mockResolvedValue({
      ...baseCommunication,
      aiSummary: 'Resumo previamente salvo.',
    });

    const result = await useCase.execute(communicationId);

    expect(generateCompletion).not.toHaveBeenCalled();
    expect(updateCommunicationAiSummary).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: communicationId,
      aiSummary: 'Resumo previamente salvo.',
      cached: true,
    });
  });

  it('throws NotFoundException when the communication does not exist', async () => {
    findCommunicationById.mockResolvedValue(null);

    await expect(useCase.execute(communicationId)).rejects.toBeInstanceOf(NotFoundException);

    expect(generateCompletion).not.toHaveBeenCalled();
  });
});
