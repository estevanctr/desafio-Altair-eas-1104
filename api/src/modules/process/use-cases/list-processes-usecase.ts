import { Inject, Injectable } from '@nestjs/common';
import { ListProcessesResponseDto } from '../dtos/list-processes-response-dto';
import type { IProcessRepository } from '../repository/contracts/process-repository';
import type { ListProcessesRequest } from '../types/list-processes-request-type';

export const PROCESSES_PAGE_SIZE = 10;

@Injectable()
export class ListProcessesUseCase {
  constructor(
    @Inject('IProcessRepository')
    private readonly processRepository: IProcessRepository,
  ) {}

  async execute(filters: ListProcessesRequest): Promise<ListProcessesResponseDto> {
    const result = await this.processRepository.listProcessesWithLatestCommunication(filters, PROCESSES_PAGE_SIZE);
    return ListProcessesResponseDto.toResponseDto(result);
  }
}
