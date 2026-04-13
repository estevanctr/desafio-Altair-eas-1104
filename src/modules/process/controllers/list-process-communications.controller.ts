import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../../auth/configs/jwt-auth.guard';
import {
  ListProcessCommunicationsQuerySchema,
  ListProcessCommunicationsRequestDto,
} from '../dtos/list-process-communications-request-dto';
import type { ListProcessCommunicationsResponseDto } from '../dtos/list-process-communications-response-dto';
import { ListProcessCommunicationsUseCase } from '../use-cases/list-process-communications-usecase';

@Controller('processes')
export class ListProcessCommunicationsController {
  constructor(
    private readonly listProcessCommunicationsUseCase: ListProcessCommunicationsUseCase,
  ) {}

  @Get(':processId/communications')
  @UseGuards(JwtAuthGuard)
  async handle(
    @Param('processId') processId: string,
    @Query(new ZodValidationPipe(ListProcessCommunicationsQuerySchema))
    query: ListProcessCommunicationsRequestDto,
  ): Promise<ListProcessCommunicationsResponseDto> {
    return this.listProcessCommunicationsUseCase.execute({
      processId,
      page: query.page,
    });
  }
}
