import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../../auth/configs/jwt-auth.guard';
import {
  ListProcessesQuerySchema,
  ListProcessesRequestDto,
} from '../dtos/list-processes-request-dto';
import type { ListProcessesResponseDto } from '../dtos/list-processes-response-dto';
import { ListProcessesUseCase } from '../use-cases/list-processes-usecase';

@Controller('processes')
export class ListProcessesController {
  constructor(private readonly listProcessesUseCase: ListProcessesUseCase) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async handle(
    @Query(new ZodValidationPipe(ListProcessesQuerySchema))
    query: ListProcessesRequestDto,
  ): Promise<ListProcessesResponseDto> {
    return this.listProcessesUseCase.execute({
      page: query.page,
      courtAcronym: query.courtAcronym,
      processNumber: query.processNumber,
      publicationDateFrom: query.publicationDateFrom,
      publicationDateTo: query.publicationDateTo,
    });
  }
}
