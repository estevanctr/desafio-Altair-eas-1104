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
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TRANSIENT_RETRIES = 3;
const TRANSIENT_BACKOFF_MS = [2_000, 4_000, 8_000];

type FetchPageResult = {
  items: ProcessApiItem[];
  count: number | null;
};

type AttemptResult =
  | { kind: 'success'; response: Response }
  | { kind: 'retry-rate-limit' }
  | { kind: 'retry-network'; reason: string }
  | { kind: 'retry-server'; status: number; body: string };

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
    const target = `${params.siglaTribunal}/${params.orgaoId} page ${page}`;

    let rateLimitAttempts = 0;
    let networkAttempts = 0;
    let serverErrorAttempts = 0;

    while (true) {
      const result = await this.attemptOnce(url, target);

      if (result.kind === 'success') {
        return this.parsePayload(result.response);
      }

      if (result.kind === 'retry-rate-limit') {
        if (rateLimitAttempts >= MAX_RATE_LIMIT_RETRIES) {
          throw new Error(
            `Rate limit retries exhausted after ${MAX_RATE_LIMIT_RETRIES} attempts for ${target}`,
          );
        }
        this.logger.warn(
          `Rate limit hit for ${target}. Waiting ${RATE_LIMIT_COOLDOWN_MS}ms before retry ${rateLimitAttempts + 1}/${MAX_RATE_LIMIT_RETRIES}`,
        );
        await this.sleep(RATE_LIMIT_COOLDOWN_MS);
        rateLimitAttempts += 1;
        continue;
      }

      if (result.kind === 'retry-network') {
        networkAttempts = await this.waitForTransientRetry(
          networkAttempts,
          target,
          result.reason,
        );
        continue;
      }

      serverErrorAttempts = await this.waitForTransientRetry(
        serverErrorAttempts,
        target,
        `server error ${result.status}${result.body ? `: ${result.body}` : ''}`,
        () =>
          this.logger.error(
            `Server error retries exhausted (${result.status}) for ${target}: ${result.body}`,
          ),
      );
    }
  }

  private async attemptOnce(
    url: string,
    target: string,
  ): Promise<AttemptResult> {
    let response: Response;
    try {
      response = await this.requestWithTimeout(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isAbort =
        error instanceof Error &&
        (error.name === 'AbortError' || message.includes('aborted'));
      const reason = isAbort
        ? `timeout after ${REQUEST_TIMEOUT_MS}ms`
        : `network error: ${message}`;
      return { kind: 'retry-network', reason };
    }

    if (response.status === 429) {
      return { kind: 'retry-rate-limit' };
    }

    if (response.status >= 500 && response.status <= 599) {
      const body = await response.text().catch(() => '');
      return { kind: 'retry-server', status: response.status, body };
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(
        `Process communications API request failed (${response.status}) for ${target}: ${body}`,
      );
      throw new Error(
        `Process communications API request failed with status ${response.status}`,
      );
    }

    return { kind: 'success', response };
  }

  private async parsePayload(response: Response): Promise<FetchPageResult> {
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

  private async waitForTransientRetry(
    attempts: number,
    target: string,
    reason: string,
    onExhausted?: () => void,
  ): Promise<number> {
    if (attempts >= MAX_TRANSIENT_RETRIES) {
      onExhausted?.();
      throw new Error(
        `Transient failure retries exhausted for ${target} (${reason})`,
      );
    }
    const backoff = TRANSIENT_BACKOFF_MS[attempts];
    this.logger.warn(
      `Transient failure for ${target} (${reason}). Retrying in ${backoff}ms (${attempts + 1}/${MAX_TRANSIENT_RETRIES})`,
    );
    await this.sleep(backoff);
    return attempts + 1;
  }

  private async requestWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
