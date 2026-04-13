import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import type { PaginatedResult } from '../repository/contracts/process-repository';
import type { CommunicationType } from '../types/communication-type';

export interface CommunicationRecipientDto {
  id: string;
  name: string;
  role: string | null;
  oabNumber: string | null;
  oabState: string | null;
  isLawyer: boolean;
}

export interface CommunicationItemDto {
  id: string;
  externalId: number;
  publicationDate: Date;
  communicationType: string;
  content: string;
  source: string | null;
  aiSummary: string | null;
  recipients: CommunicationRecipientDto[];
}

export interface ListProcessCommunicationsResponseDto {
  items: CommunicationItemDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const ListProcessCommunicationsResponseDto = {
  toResponseDto(
    result: PaginatedResult<CommunicationType>,
  ): ListProcessCommunicationsResponseDto {
    return {
      items: result.items.map((communication) => ({
        id: communication.id,
        externalId: communication.externalId,
        publicationDate: communication.publicationDate,
        communicationType: communication.communicationType,
        content: communication.content,
        source: communication.source,
        aiSummary: communication.aiSummary,
        recipients: (communication.recipients ?? []).map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          role: recipient.role,
          oabNumber: recipient.oabNumber,
          oabState: recipient.oabState,
          isLawyer: recipient.isLawyer,
        })),
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages:
        result.pageSize > 0 ? Math.ceil(result.total / result.pageSize) : 0,
    };
  },
};

const recipientSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  role: z.string().nullable(),
  oabNumber: z.string().nullable(),
  oabState: z.string().nullable(),
  isLawyer: z.boolean(),
});

const communicationItemSchema = z.object({
  id: z.uuid(),
  externalId: z.number().int(),
  publicationDate: z.iso.datetime(),
  communicationType: z.string(),
  content: z.string(),
  source: z.string().nullable(),
  aiSummary: z.string().nullable(),
  recipients: z.array(recipientSchema),
});

export class ListProcessCommunicationsResponseSchema extends createZodDto(
  z.object({
    items: z.array(communicationItemSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    totalPages: z.number().int(),
  }),
) {}
