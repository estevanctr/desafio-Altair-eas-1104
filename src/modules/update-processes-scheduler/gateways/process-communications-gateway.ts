import { Injectable, Logger } from '@nestjs/common';
import { ProcessCommunicationAdapter } from '../adapters/process-communication.adapter';
import { ProcessApiItem } from '../types/process-api-item.type';
import { ProcessSyncInput } from '../types/process-sync-input.type';
import {
  FetchCommunicationsParams,
  IProcessCommunicationsGateway,
} from './contracts/process-communications-gateway';

const BASE_URL = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
const ITEMS_PER_PAGE = 100;

@Injectable()
export class ProcessCommunicationsGateway implements IProcessCommunicationsGateway {
  private readonly logger = new Logger(ProcessCommunicationsGateway.name);

  async fetchAllCommunications(
    params: FetchCommunicationsParams,
  ): Promise<ProcessSyncInput[]> {
    const rawItems = await this.fetchAllRawItems(params);
    return rawItems.map((item) =>
      ProcessCommunicationAdapter.toSyncInput(item),
    );
  }

  private async fetchAllRawItems(
    params: FetchCommunicationsParams,
  ): Promise<ProcessApiItem[]> {
    const results: ProcessApiItem[] = [];
    let page = 1;

    while (true) {
      const pageItems = await this.fetchPage(params, page);
      if (pageItems.length === 0) break;

      results.push(...pageItems);

      if (pageItems.length < ITEMS_PER_PAGE) break;
      page += 1;
    }

    return results;
  }

  private async fetchPage(
    params: FetchCommunicationsParams,
    page: number,
  ): Promise<ProcessApiItem[]> {
    const query = new URLSearchParams({
      siglaTribunal: params.siglaTribunal,
      orgaoId: String(params.orgaoId),
      dataDisponibilizacaoInicio: params.dataDisponibilizacaoInicio,
      dataDisponibilizacaoFim: params.dataDisponibilizacaoFim,
      pagina: String(page),
      itensPorPagina: String(ITEMS_PER_PAGE),
    });

    const url = `${BASE_URL}?${query.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `Process communications API request failed (${response.status}) for ${params.siglaTribunal}/${params.orgaoId} page ${page}: ${body}`,
      );
      throw new Error(
        `Process communications API request failed with status ${response.status}`,
      );
    }

    const payload = (await response.json()) as
      | ProcessApiItem[]
      | { items?: ProcessApiItem[] };

    if (Array.isArray(payload)) return payload;
    return payload.items ?? [];
  }
}
