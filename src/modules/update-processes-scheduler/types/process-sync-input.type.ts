export type ProcessSyncProcessInput = {
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
};

export type ProcessSyncCommunicationInput = {
  externalId: number;
  publicationDate: Date;
  communicationType: string;
  content: string;
  source: string | null;
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
