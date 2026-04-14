import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/configs/jwt-auth.guard';
import type { SummarizeCommunicationResponseDto } from '../dtos/summarize-communication-response-dto';
import { SummarizeCommunicationResponseSchema } from '../dtos/summarize-communication-response-dto';
import { SummarizeCommunicationUseCase } from '../use-cases/summarize-communication-usecase';

@ApiTags('Processes')
@ApiBearerAuth()
@Controller('processes')
export class SummarizeCommunicationController {
  constructor(
    private readonly summarizeCommunicationUseCase: SummarizeCommunicationUseCase,
  ) {}

  @Get('communications/:communicationId/summary')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generate (or retrieve the cached) AI summary of a communication',
    description:
      'Generates a plain-language summary of a judicial communication via LLM (Groq · llama-3.3-70b-versatile). If the communication already has a persisted `aiSummary`, it is returned immediately with `cached: true` and the LLM is not called.',
  })
  @ApiParam({
    name: 'communicationId',
    description: 'UUID of the target communication.',
    format: 'uuid',
  })
  @ApiOkResponse({ type: SummarizeCommunicationResponseSchema })
  @ApiNotFoundResponse({ description: 'Communication not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async handle(
    @Param('communicationId') communicationId: string,
  ): Promise<SummarizeCommunicationResponseDto> {
    return this.summarizeCommunicationUseCase.execute(communicationId);
  }
}
