export type ProcessWithLatestCommunicationType = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  communicationType: string;
  publicationDate: Date;
  content: string;
  aiSummary: string | null;
  recipientNames: string;
};
