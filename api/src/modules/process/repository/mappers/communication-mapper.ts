import type { CommunicationSource } from '../../../../../generated/prisma/client';
import type { CommunicationType } from '../../types/communication-type';
import type { RecipientType } from '../../types/recipient-type';

type PrismaRecipientRecord = {
  id: string;
  name: string;
  role: string | null;
  oabNumber: string | null;
  oabState: string | null;
  isLawyer: boolean;
};

type PrismaCommunicationRecord = {
  id: string;
  externalId: number;
  publicationDate: Date;
  communicationType: string;
  content: string;
  source: CommunicationSource | null;
  aiSummary: string | null;
  processId: string;
  createdAt: Date;
  recipients?: PrismaRecipientRecord[];
};

export class CommunicationMapper {
  static toDomain(record: PrismaCommunicationRecord): CommunicationType {
    return {
      id: record.id,
      externalId: record.externalId,
      publicationDate: record.publicationDate,
      communicationType: record.communicationType,
      content: record.content,
      source: record.source,
      aiSummary: record.aiSummary,
      processId: record.processId,
      createdAt: record.createdAt,
      recipients: record.recipients?.map(
        (recipient): RecipientType => ({
          id: recipient.id,
          name: recipient.name,
          role: recipient.role,
          oabNumber: recipient.oabNumber,
          oabState: recipient.oabState,
          isLawyer: recipient.isLawyer,
        }),
      ),
    };
  }
}
