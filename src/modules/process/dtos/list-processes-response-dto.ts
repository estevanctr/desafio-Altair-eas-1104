import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { PaginatedResult } from '../repository/contracts/process-repository';
import type { ProcessWithLatestCommunicationType } from '../types/process-with-latest-communication-type';

export interface ListProcessesItemDto {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  latestCommunication: {
    communicationType: string;
    publicationDate: Date;
    content: string;
    aiSummary: string | null;
    recipients: string[];
  };
}

export interface ListProcessesResponseDto {
  items: ListProcessesItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ListProcessesResponseDto = {
  toResponseDto(
    result: PaginatedResult<ProcessWithLatestCommunicationType>,
  ): ListProcessesResponseDto {
    return {
      items: result.items.map((item) => ({
        id: item.id,
        processNumber: item.processNumber,
        courtAcronym: item.courtAcronym,
        organName: item.organName,
        latestCommunication: {
          communicationType: item.communicationType,
          publicationDate: item.publicationDate,
          content: item.content,
          aiSummary: item.aiSummary,
          recipients: item.recipientNames
            ? item.recipientNames.split(',').map((name) => name.trim())
            : [],
        },
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages:
        result.pageSize > 0 ? Math.ceil(result.total / result.pageSize) : 0,
    };
  },
};

const latestCommunicationSchema = z.object({
  communicationType: z.string(),
  publicationDate: z.iso.datetime(),
  content: z.string(),
  aiSummary: z.string().nullable(),
  recipients: z.array(z.string()),
});

const processItemSchema = z.object({
  id: z.uuid(),
  processNumber: z.string(),
  courtAcronym: z.string(),
  organName: z.string(),
  latestCommunication: latestCommunicationSchema,
});

export class ListProcessesResponseSchema extends createZodDto(
  z.object({
    items: z.array(processItemSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
  }),
) {}
