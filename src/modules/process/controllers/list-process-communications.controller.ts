import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { JwtAuthGuard } from '../../auth/configs/jwt-auth.guard';
import {
  ListProcessCommunicationsQuerySchema,
  ListProcessCommunicationsRequestDto,
} from '../dtos/list-process-communications-request-dto';
import type { ListProcessCommunicationsResponseDto } from '../dtos/list-process-communications-response-dto';
import { ListProcessCommunicationsResponseSchema } from '../dtos/list-process-communications-response-dto';
import { ListProcessCommunicationsUseCase } from '../use-cases/list-process-communications-usecase';

@ApiTags('Processes')
@ApiBearerAuth()
@Controller('processes')
export class ListProcessCommunicationsController {
  constructor(
    private readonly listProcessCommunicationsUseCase: ListProcessCommunicationsUseCase,
  ) {}

  @Get(':processId/communications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all communications for a given process' })
  @ApiOkResponse({ type: ListProcessCommunicationsResponseSchema })
  @ApiNotFoundResponse({ description: 'Process not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
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
