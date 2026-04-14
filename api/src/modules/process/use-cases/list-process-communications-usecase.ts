import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ListProcessCommunicationsResponseDto } from '../dtos/list-process-communications-response-dto';
import type { IProcessRepository } from '../repository/contracts/process-repository';
import type { ListProcessCommunicationsRequest } from '../types/list-process-communications-request-type';

export const COMMUNICATIONS_PAGE_SIZE = 10;

@Injectable()
export class ListProcessCommunicationsUseCase {
  constructor(
    @Inject('IProcessRepository')
    private readonly processRepository: IProcessRepository,
  ) {}

  async execute(input: ListProcessCommunicationsRequest): Promise<ListProcessCommunicationsResponseDto> {
    const process = await this.processRepository.findById(input.processId);
    if (!process) {
      throw new NotFoundException('Process not found');
    }

    const result = await this.processRepository.listCommunicationsByProcess(input, COMMUNICATIONS_PAGE_SIZE);

    return ListProcessCommunicationsResponseDto.toResponseDto(process, result);
  }
}
