import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FetchCommunicationsParams } from '../../gateways/contracts/process-communications-gateway';
import { ProcessCommunicationsGateway } from '../../gateways/process-communications-gateway';
import type { ProcessApiItem } from '../../types/process-api-item.type';

const DEFAULT_PARAMS: FetchCommunicationsParams = {
  siglaTribunal: 'TRT10',
  orgaoId: 46612,
  dataDisponibilizacaoInicio: '2026-04-10',
  dataDisponibilizacaoFim: '2026-04-10',
};

function makeApiItem(id: number): ProcessApiItem {
  return {
    id,
    numero_processo: `0000000-00.2026.5.10.${String(id).padStart(4, '0')}`,
    siglaTribunal: 'TRT10',
    nomeOrgao: '18ª Vara',
    data_disponibilizacao: '2026-04-10',
    tipoComunicacao: 'Intimação',
    texto: 'conteúdo',
    meio: 'Diário Eletrônico',
    destinatarios: [],
    destinatarioadvogados: [],
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function textResponse(body: string, status: number): Response {
  return new Response(body, { status });
}

function makeGateway(): ProcessCommunicationsGateway {
  const configService = {
    get: vi.fn().mockReturnValue('https://api.example.com/comunicacoes'),
  } as any;
  return new ProcessCommunicationsGateway(configService);
}

async function collectAll(gen: AsyncIterable<unknown[]>): Promise<unknown[]> {
  const all: unknown[] = [];
  for await (const batch of gen) {
    all.push(...batch);
  }
  return all;
}

async function drainTimers(ms = 300_000) {
  const step = 10_000;
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    await vi.advanceTimersByTimeAsync(step);
  }
}

async function collectWithDrain(gen: AsyncIterable<unknown[]>): Promise<{ results?: unknown[]; error?: Error }> {
  const promise = collectAll(gen).then(
    (results) => ({ results }),
    (err) => ({ error: err as Error }),
  );
  await drainTimers();
  return promise;
}

describe('ProcessCommunicationsGateway', () => {
  let gateway: ProcessCommunicationsGateway;

  beforeEach(() => {
    vi.useFakeTimers();
    gateway = makeGateway();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stops after one page when the response is a plain array with fewer items than page size', async () => {
    const items = [makeApiItem(1), makeApiItem(2)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(items)));

    const results = await collectAll(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops when count is reached across multiple pages', async () => {
    const page1Items = Array.from({ length: 100 }, (_, i) => makeApiItem(i + 1));
    const page2Items = Array.from({ length: 50 }, (_, i) => makeApiItem(i + 101));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ items: page1Items, count: 150 }))
      .mockResolvedValueOnce(jsonResponse({ items: page2Items, count: 150 }));

    vi.stubGlobal('fetch', fetchMock);

    const { results } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(150);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops immediately when the first page returns an empty array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    const results = await collectAll(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('stops when object payload has empty items array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items: [], count: 0 })));

    const results = await collectAll(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(0);
  });

  it('retries after 429 with cooldown and eventually succeeds', async () => {
    const items = [makeApiItem(1)];
    const fetchMock = vi.fn().mockResolvedValueOnce(textResponse('', 429)).mockResolvedValueOnce(jsonResponse(items));

    vi.stubGlobal('fetch', fetchMock);

    const { results } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting rate-limit retries (3 consecutive 429s)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('', 429));
    vi.stubGlobal('fetch', fetchMock);

    const { error } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(error).toBeDefined();
    expect(error!.message).toMatch(/rate limit retries exhausted/i);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('retries 5xx with exponential backoff and eventually succeeds', async () => {
    const items = [makeApiItem(1)];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(textResponse('Internal Server Error', 500))
      .mockResolvedValueOnce(textResponse('Bad Gateway', 502))
      .mockResolvedValueOnce(jsonResponse(items));

    vi.stubGlobal('fetch', fetchMock);

    const { results } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws after exhausting server-error retries (3 consecutive 5xx)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(textResponse('error', 500));
    vi.stubGlobal('fetch', fetchMock);

    const { error } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(error).toBeDefined();
    expect(error!.message).toMatch(/transient failure retries exhausted/i);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('throws immediately on 4xx errors (non-429) without retrying', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(textResponse('Not Found', 404)));

    const { error } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(error).toBeDefined();
    expect(error!.message).toMatch(/status 404/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors with backoff and eventually succeeds', async () => {
    const items = [makeApiItem(1)];
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))
      .mockResolvedValueOnce(jsonResponse(items));

    vi.stubGlobal('fetch', fetchMock);

    const { results } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('classifies AbortError as a timeout retry', async () => {
    const items = [makeApiItem(1)];
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    const fetchMock = vi.fn().mockRejectedValueOnce(abortError).mockResolvedValueOnce(jsonResponse(items));

    vi.stubGlobal('fetch', fetchMock);

    const { results } = await collectWithDrain(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('handles plain array payload (legacy format without count)', async () => {
    const items = [makeApiItem(1), makeApiItem(2)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(items)));

    const results = await collectAll(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(2);
  });

  it('handles object payload with items and count', async () => {
    const items = [makeApiItem(1)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items, count: 1 })));

    const results = await collectAll(gateway.streamCommunications(DEFAULT_PARAMS));

    expect(results).toHaveLength(1);
  });
});
