export type ListProcessesRequest = {
  page: number;
  courtAcronym?: string;
  processNumber?: string;
  publicationDateFrom?: Date;
  publicationDateTo?: Date;
};
