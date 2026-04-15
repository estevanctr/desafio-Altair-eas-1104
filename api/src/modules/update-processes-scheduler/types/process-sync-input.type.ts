export type ProcessSyncProcessInput = {
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
};

import { CommunicationSource } from '../../../../generated/prisma/client';

export type ProcessSyncCommunicationInput = {
  externalId: number;
  publicationDate: Date;
  communicationType: string;
  content: string;
  source: CommunicationSource | null;
};

export type ProcessSyncRecipientInput = {
  name: string;
  role: string | null;
  oabNumber: string | null;
  oabState: string | null;
  isLawyer: boolean;
};

export type ProcessSyncInput = {
  process: ProcessSyncProcessInput;
  communication: ProcessSyncCommunicationInput;
  recipients: ProcessSyncRecipientInput[];
};
