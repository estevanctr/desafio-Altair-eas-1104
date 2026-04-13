import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListProcessesController } from '../../controllers/list-processes.controller';
import type { ListProcessesResponseDto } from '../../dtos/list-processes-response-dto';
import { ListProcessesUseCase } from '../../use-cases/list-processes-usecase';

describe('ListProcessesController', () => {
  let useCase: { execute: ReturnType<typeof vi.fn> };
  let controller: ListProcessesController;

  beforeEach(() => {
    useCase = { execute: vi.fn() };
    controller = new ListProcessesController(
      useCase as unknown as ListProcessesUseCase,
    );
  });

  it('forwards query parameters (including the publication date range) to the use case', async () => {
    const publicationDateFrom = new Date('2026-04-01T00:00:00Z');
    const publicationDateTo = new Date('2026-04-10T23:59:59Z');
    const response: ListProcessesResponseDto = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
      totalPages: 0,
    };
    useCase.execute.mockResolvedValue(response);

    const result = await controller.handle({
      page: 2,
      courtAcronym: 'TJSP',
      processNumber: '0001-23',
      publicationDateFrom,
      publicationDateTo,
    });

    expect(useCase.execute).toHaveBeenCalledWith({
      page: 2,
      courtAcronym: 'TJSP',
      processNumber: '0001-23',
      publicationDateFrom,
      publicationDateTo,
    });
    expect(result).toBe(response);
  });

  it('propagates errors thrown by the use case', async () => {
    const error = new Error('boom');
    useCase.execute.mockRejectedValue(error);

    await expect(
      controller.handle({
        page: 1,
        courtAcronym: undefined,
        processNumber: undefined,
        publicationDateFrom: undefined,
        publicationDateTo: undefined,
      }),
    ).rejects.toBe(error);
  });
});
