import { ProcessSyncInput } from '../../types/process-sync-input.type';

export type FetchCommunicationsParams = {
  siglaTribunal: string;
  orgaoId: number;
  dataDisponibilizacaoInicio: string;
  dataDisponibilizacaoFim: string;
};

export interface IProcessCommunicationsGateway {
  fetchAllCommunications(
    params: FetchCommunicationsParams,
  ): Promise<ProcessSyncInput[]>;
}
