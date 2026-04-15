import type { CommunicationSource } from '../../../../generated/prisma/client';
import type { RecipientType } from './recipient-type';

export type CommunicationType = {
  id: string;
  externalId: number;
  publicationDate: Date;
  communicationType: string;
  content: string;
  source: CommunicationSource | null;
  aiSummary: string | null;
  processId: string;
  createdAt: Date;
  recipients?: RecipientType[];
};
