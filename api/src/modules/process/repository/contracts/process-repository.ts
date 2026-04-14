import type { CommunicationType } from '../../types/communication-type';
import type { ListProcessCommunicationsRequest } from '../../types/list-process-communications-request-type';
import type { ListProcessesRequest } from '../../types/list-processes-request-type';
import type { ProcessType } from '../../types/process-type';
import type { ProcessWithLatestCommunicationType } from '../../types/process-with-latest-communication-type';

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export interface IProcessRepository {
  listProcessesWithLatestCommunication(
    filters: ListProcessesRequest,
    pageSize: number,
  ): Promise<PaginatedResult<ProcessWithLatestCommunicationType>>;

  findById(id: string): Promise<ProcessType | null>;

  listCommunicationsByProcess(
    input: ListProcessCommunicationsRequest,
    pageSize: number,
  ): Promise<PaginatedResult<CommunicationType>>;

  findCommunicationById(id: string): Promise<CommunicationType | null>;

  updateCommunicationAiSummary(
    id: string,
    aiSummary: string,
  ): Promise<CommunicationType>;
}
