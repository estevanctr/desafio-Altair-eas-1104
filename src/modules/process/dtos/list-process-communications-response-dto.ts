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
