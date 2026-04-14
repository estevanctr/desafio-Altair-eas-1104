export type LatestCommunication = {
  communicationType: string;
  publicationDate: string;
  content: string;
  aiSummary: string | null;
  recipients: string[];
};

export type Process = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  latestCommunication: LatestCommunication;
};

export type ProcessesListResponse = {
  items: Process[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ProcessesFilters = {
  page: number;
  processNumber?: string;
  courtAcronym?: string;
  publicationDateFrom?: string;
  publicationDateTo?: string;
};

export type CommunicationRecipient = {
  id: string;
  name: string;
  role: string | null;
  oabNumber: string | null;
  oabState: string | null;
  isLawyer: boolean;
};

export type ProcessCommunicationItem = {
  id: string;
  externalId: number;
  publicationDate: string;
  communicationType: string;
  content: string;
  source: string | null;
  aiSummary: string | null;
  recipients: CommunicationRecipient[];
};

export type ProcessSummary = {
  id: string;
  processNumber: string;
  courtAcronym: string;
  organName: string;
  hasFinalJudgment: boolean;
};

export type ProcessCommunicationsResponse = {
  process: ProcessSummary;
  items: ProcessCommunicationItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
