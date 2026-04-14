import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export interface SummarizeCommunicationResponseDto {
  id: string;
  aiSummary: string;
  cached: boolean;
}

export const SummarizeCommunicationResponseDto = {
  toResponseDto(id: string, aiSummary: string, cached: boolean): SummarizeCommunicationResponseDto {
    return { id, aiSummary, cached };
  },
};

export class SummarizeCommunicationResponseSchema extends createZodDto(
  z.object({
    id: z.uuid(),
    aiSummary: z.string(),
    cached: z.boolean(),
  }),
) {}
