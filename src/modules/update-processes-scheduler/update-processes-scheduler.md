# Update Processes Scheduler

## Purpose

This module keeps the local database in sync with judicial communications published by the public [PJe Comunica API](https://comunicaapi.pje.jus.br). On a fixed schedule, it queries a pre-defined set of courts/organs, fetches all communications for the reference date and persists each new item (process, communication and recipients) — avoiding duplicates and flagging processes whose case has reached final judgment (*transitou em julgado*).

In short: it is the worker that feeds the application's process domain from an external source, with no manual intervention.

## Architecture

The module follows a layered architecture with dependency inversion via Nest tokens (`IProcessCommunicationsGateway`, `IProcessSyncRepository`), isolating the use case from I/O details (HTTP and Prisma).

```
┌─────────────────────────────────────────────────────────────┐
│                    UpdateProcessesJob                       │
│              (@Cron '0 1 * * *' — daily at 01:00)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ execute()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                UpdateProcessesUseCase                       │
│    Orchestrates the flow per organ, aggregates metrics     │
└─────────┬──────────────────────────────────┬────────────────┘
          │                                  │
          │ fetchAllCommunications            │ persistCommunication
          ▼                                  ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│ ProcessCommunicationsGateway│   │   ProcessSyncRepository    │
│   (HTTP + pagination)      │   │   (Prisma + transaction)   │
└──────────────┬─────────────┘   └──────────────┬─────────────┘
               │                                │
               ▼                                ▼
   ┌───────────────────────┐        ┌────────────────────────┐
   │ ProcessCommunication  │        │        Database        │
   │      Adapter          │        │ (Process, Communication│
   │ (API → ProcessSync    │        │        Recipient)      │
   │       Input)          │        └────────────────────────┘
   └───────────────────────┘
```

### Layers and responsibilities

| Layer | File | Responsibility |
|---|---|---|
| **Job / Scheduler** | [jobs/update-processes.job.ts](jobs/update-processes.job.ts) | Triggers the use case on a daily cron (`@Cron('0 1 * * *')` — every day at 01:00), logs start/finish and catches errors so the scheduler stays alive. |
| **Use Case** | [use-cases/update-processes-usecase.ts](use-cases/update-processes-usecase.ts) | Orchestrates the flow: iterates the list of organs, calls the gateway, persists via the repository, builds an `UpdateProcessesSummary` and isolates failures per organ. |
| **Gateway (contract)** | [gateways/contracts/process-communications-gateway.ts](gateways/contracts/process-communications-gateway.ts) | Declares `IProcessCommunicationsGateway`, the contract the use case depends on (dependency inversion). |
| **Gateway (implementation)** | [gateways/process-communications-gateway.ts](gateways/process-communications-gateway.ts) | Implements paginated HTTP fetching against the PJe Comunica API, handles non-ok statuses and unwraps `items` when applicable. |
| **Adapter** | [adapters/process-communication.adapter.ts](adapters/process-communication.adapter.ts) | Converts the raw API payload (`ProcessApiItem`) into the internal shape (`ProcessSyncInput`), normalizing recipients and detecting "transitou em julgado". |
| **Repository (contract)** | [repository/contracts/process-sync-repository.ts](repository/contracts/process-sync-repository.ts) | Declares `IProcessSyncRepository` with the `persistCommunication` operation. |
| **Repository (implementation)** | [repository/process-sync-repository.ts](repository/process-sync-repository.ts) | Persists the communication through Prisma inside a single transaction: checks duplicates by `externalId`, upserts the process and creates the communication plus recipients. |
| **Types** | [types/](types/) | Shared types: `ProcessApiItem` (external shape), `ProcessSyncInput` (internal shape) and `ScheduledOrganQuery` (list of monitored organs). |
| **Module** | [update-processes-scheduler.module.ts](update-processes-scheduler.module.ts) | Registers providers and binds the concrete implementations to the `IProcessCommunicationsGateway` and `IProcessSyncRepository` tokens. |

### Monitored organs

The list is defined statically in [types/scheduled-organ-query.type.ts](types/scheduled-organ-query.type.ts) as `SCHEDULED_ORGAN_QUERIES`:

- **TRT10** — 18ª Vara do Trabalho de Brasília - DF (`orgaoId: 46612`)
- **TJTO** — Central de Expedição de Precatório e RPVs (`orgaoId: 95263`)
- **TJRS** — 1ª Vara Judicial da Comarca de São Lourenço do Sul (`orgaoId: 38458`)

To monitor a new organ, just add an entry to this array.

## End-to-end flow

1. **Cron trigger** — [UpdateProcessesJob](jobs/update-processes.job.ts) runs daily at 01:00 (`@Cron('0 1 * * *')`) and calls `UpdateProcessesUseCase.execute()`. The job wraps the call in `try/catch` and measures duration for observability.

2. **Per-organ orchestration** — The use case resolves its own `referenceDate` internally via `getYesterdayIsoDate()` (UTC), initializes an empty `UpdateProcessesSummary` and iterates over `SCHEDULED_ORGAN_QUERIES`. Each organ is processed in isolation through `processOrgan`: if one organ fails, the others keep running and the error is recorded in that organ's summary entry.

3. **Paginated API fetch** — `ProcessCommunicationsGateway.fetchAllCommunications` builds the query with `siglaTribunal`, `orgaoId` and the `dataDisponibilizacaoInicio/Fim` window and paginates 100 items at a time (`ITEMS_PER_PAGE`). The loop stops when the page comes back empty or with fewer items than the page size. Non-`ok` responses throw, interrupting only that organ's processing.

4. **Payload adaptation** — Each `ProcessApiItem` is transformed by [ProcessCommunicationAdapter.toSyncInput](adapters/process-communication.adapter.ts), which:
   - Extracts process fields (`numero_processo`, `siglaTribunal`, `nomeOrgao`).
   - Flags final judgment by searching for `"transitou em julgado"` in the text (case-insensitive).
   - Merges regular recipients (`destinatarios`) and lawyers (`destinatarioadvogados`) into a single list, marking `isLawyer` and preserving OAB information when available.

5. **Transactional persistence** — For each `ProcessSyncInput`, [ProcessSyncRepository.persistCommunication](repository/process-sync-repository.ts) opens a Prisma transaction and:
   - Checks whether a `Communication` with the same `externalId` already exists. If so, it returns `{ created: false }` (idempotency — previously ingested communications are skipped).
   - Upserts the `Process` by `processNumber` (creates it if new, keeps the existing one otherwise).
   - Creates the `Communication` linked to the process and, in a nested write, all its `Recipient`s.
   - Returns `{ created: true }`.

6. **Aggregation and logging** — The use case increments `fetched`, `created` and `skipped` counters per organ and the totals on `summary`, logging one line per organ plus a final aggregate. The job then logs total duration and consolidated counts.

### Use case contract

```ts
execute(): Promise<UpdateProcessesSummary>
```

- The use case takes no arguments. It always derives the reference date from `getYesterdayIsoDate()` (UTC), which is used as both the start **and** end of the availability window on the API.
- The return value (`UpdateProcessesSummary`) contains totals and a per-organ breakdown, useful for observability and tests.

### Guarantees and properties

- **Idempotent** — re-running on the same reference date never duplicates communications (checked by `externalId`).
- **Resilient to partial failures** — an error on one organ does not abort the others; the error is stored in the `perOrgan` entry of the summary.
- **Transactional** — each communication is persisted inside a Prisma transaction, keeping `Process`, `Communication` and `Recipient` consistent.
- **Decoupled** — the use case depends only on interfaces; swapping the HTTP source or the persistence mechanism does not require touching the business rule.
