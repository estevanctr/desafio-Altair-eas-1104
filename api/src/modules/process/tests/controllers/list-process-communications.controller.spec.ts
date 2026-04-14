import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListProcessCommunicationsController } from '../../controllers/list-process-communications.controller';
import type { ListProcessCommunicationsResponseDto } from '../../dtos/list-process-communications-response-dto';
import { ListProcessCommunicationsUseCase } from '../../use-cases/list-process-communications-usecase';

describe('ListProcessCommunicationsController', () => {
  let useCase: { execute: ReturnType<typeof vi.fn> };
  let controller: ListProcessCommunicationsController;

  beforeEach(() => {
    useCase = { execute: vi.fn() };
    controller = new ListProcessCommunicationsController(useCase as unknown as ListProcessCommunicationsUseCase);
  });

  it('delegates to the use case with the processId from the route and the page from the query', async () => {
    const response: ListProcessCommunicationsResponseDto = {
      process: {
        id: 'process-1',
        processNumber: '0000000-00.0000.0.00.0000',
        courtAcronym: 'TRT10',
        organName: 'Vara do Trabalho',
        hasFinalJudgment: false,
      },
      items: [],
      total: 0,
      page: 3,
      pageSize: 10,
      totalPages: 0,
    };
    useCase.execute.mockResolvedValue(response);

    const result = await controller.handle('process-1', { page: 3 });

    expect(useCase.execute).toHaveBeenCalledWith({
      processId: 'process-1',
      page: 3,
    });
    expect(result).toBe(response);
  });

  it('propagates errors thrown by the use case', async () => {
    const error = new Error('boom');
    useCase.execute.mockRejectedValue(error);

    await expect(controller.handle('process-1', { page: 1 })).rejects.toBe(error);
  });
});
