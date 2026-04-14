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
