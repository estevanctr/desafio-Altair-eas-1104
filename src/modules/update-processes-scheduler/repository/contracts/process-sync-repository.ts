import { ProcessSyncInput } from '../../types/process-sync-input.type';

export type PersistResult = {
  created: boolean;
};

export interface IProcessSyncRepository {
  persistCommunication(input: ProcessSyncInput): Promise<PersistResult>;
}
