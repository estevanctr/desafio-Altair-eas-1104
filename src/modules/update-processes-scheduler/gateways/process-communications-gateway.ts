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
const DELAY_BETWEEN_PAGES_MS = 1000;
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_RATE_LIMIT_RETRIES = 3;

type FetchPageResult = {
  items: ProcessApiItem[];
  count: number | null;
};

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
      if (page > 1) {
        await this.sleep(DELAY_BETWEEN_PAGES_MS);
      }

      const { items, count } = await this.fetchPage(params, page);
      if (items.length === 0) break;

      results.push(...items);

      if (count !== null) {
        if (page * ITEMS_PER_PAGE >= count) break;
      } else if (items.length < ITEMS_PER_PAGE) {
        break;
      }

      page += 1;
    }

    return results;
  }

  private async fetchPage(
    params: FetchCommunicationsParams,
    page: number,
  ): Promise<FetchPageResult> {
    const query = new URLSearchParams({
      siglaTribunal: params.siglaTribunal,
      orgaoId: String(params.orgaoId),
      dataDisponibilizacaoInicio: params.dataDisponibilizacaoInicio,
      dataDisponibilizacaoFim: params.dataDisponibilizacaoFim,
      pagina: String(page),
      itensPorPagina: String(ITEMS_PER_PAGE),
    });

    const url = `${BASE_URL}?${query.toString()}`;

    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (response.status === 429) {
        if (attempt === MAX_RATE_LIMIT_RETRIES) {
          throw new Error(
            `Rate limit retries exhausted after ${MAX_RATE_LIMIT_RETRIES} attempts for ${params.siglaTribunal}/${params.orgaoId} page ${page}`,
          );
        }
        this.logger.warn(
          `Rate limit hit for ${params.siglaTribunal}/${params.orgaoId} page ${page}. Waiting ${RATE_LIMIT_COOLDOWN_MS}ms before retry ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES}`,
        );
        await this.sleep(RATE_LIMIT_COOLDOWN_MS);
        continue;
      }

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
        | { items?: ProcessApiItem[]; count?: number };

      if (Array.isArray(payload)) {
        return { items: payload, count: null };
      }
      return {
        items: payload.items ?? [],
        count: typeof payload.count === 'number' ? payload.count : null,
      };
    }

    throw new Error(
      `Unreachable: fetchPage retry loop exited without result for ${params.siglaTribunal}/${params.orgaoId} page ${page}`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
