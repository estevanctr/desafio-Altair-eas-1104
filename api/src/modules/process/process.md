# Process Module

The Process Module exposes read endpoints for judicial processes and their communications. It follows the same layered architecture used across the project (Controller → Use Case → Repository → Domain), keeping HTTP, business rules, and persistence concerns strictly isolated.

## Architecture Overview

```
process/
├── controllers/      # HTTP layer (NestJS controllers)
├── use-cases/        # Application business rules
├── repository/       # Data access layer
│   ├── contracts/    # Repository interfaces (ports)
│   └── mappers/      # Prisma ↔ domain translation
├── dtos/             # Request/response DTOs and Zod schemas
├── types/            # Domain types and request shapes
├── tests/            # Unit tests mirroring the source structure
└── process.module.ts # NestJS module wiring
```

### Layer Responsibilities

- **Controllers** — Receive HTTP requests, apply `JwtAuthGuard`, validate query/params through `ZodValidationPipe`, and delegate to the matching use case. They contain no business logic.
- **Use Cases** — Encapsulate application rules: resolving filters, enforcing that a process exists before listing its communications, and shaping the response through DTOs.
- **Repository** — Implements `IProcessRepository` on top of Prisma. Abstracts both the raw SQL query used for the "latest communication per process" listing and the ORM-based query for per-process communications.
- **Mappers** — `ProcessMapper` and `CommunicationMapper` convert Prisma records into the module's domain types, so ORM fields never leak upward.
- **DTOs & Schemas** — Zod schemas (`nestjs-zod`) provide runtime validation and TypeScript types for query parameters. Response DTOs are plain interfaces paired with a `toResponseDto` factory that owns the output shape.

## Dependency Injection

Wiring lives in [process.module.ts](process.module.ts):

- `IProcessRepository` is registered with the string token `'IProcessRepository'` and bound to the Prisma-backed `ProcessRepository`.
- The module imports `AuthModule` to reuse `JwtAuthGuard` for endpoint protection.
- `PrismaService` is provided locally to satisfy the repository's dependency.

## Endpoints

Both endpoints are protected by `JwtAuthGuard` and paginated with a fixed page size of **10 items**.

### `GET /processes` — List Processes with Latest Communication

Handled by [list-processes.controller.ts](controllers/list-processes.controller.ts) and executed by [list-processes-usecase.ts](use-cases/list-processes-usecase.ts).

**Purpose:** return a paginated list of processes, each enriched with its single most recent communication and the corresponding recipients.

**Query parameters:**
- `page` *(optional, default `1`)*
- `courtAcronym` *(optional)* — exact match on the process court
- `processNumber` *(optional)* — exact match on the process number
- `publicationDateFrom` *(optional, ISO date)* — lower bound on the latest communication's `publicationDate`
- `publicationDateTo` *(optional, ISO date)* — upper bound on the latest communication's `publicationDate`

The schema enforces that `publicationDateFrom <= publicationDateTo` and rejects invalid ISO dates.

**Persistence strategy:** the repository uses `prisma.$queryRaw` with `Prisma.sql` fragments to safely compose filters. The query selects the most recent communication per process via `DISTINCT ON (p.id)` ordered by `c."publicationDate" DESC`, then wraps the result in an outer query that applies the publication-date range filter and re-orders the final rows by the latest communication's date descending. A second `COUNT` query over the same subquery provides the total for pagination.

**Response shape:** `ListProcessesResponseDto` contains `items`, `total`, `page`, `pageSize`, and `totalPages`. Each item exposes the process identifiers and a `latestCommunication` object with `communicationType`, `publicationDate`, `content`, `aiSummary`, and the list of `recipients` (split from the SQL-level `string_agg`).

### `GET /processes/:processId/communications` — List Communications of a Process

Handled by [list-process-communications.controller.ts](controllers/list-process-communications.controller.ts) and executed by [list-process-communications-usecase.ts](use-cases/list-process-communications-usecase.ts).

**Purpose:** return a paginated list of all communications for a given process, including their recipients, together with the total count of communications that process has.

**Parameters:**
- `processId` *(route param)* — UUID of the target process
- `page` *(query, optional, default `1`)*

**Flow:**
1. The use case calls `processRepository.findById(processId)`; if the process does not exist it throws `NotFoundException`.
2. It then calls `processRepository.listCommunicationsByProcess`, which uses Prisma's `findMany` ordered by `publicationDate desc`, includes `recipients`, and runs a parallel `count` to expose the full total of communications for that process.
3. The result is mapped through `ListProcessCommunicationsResponseDto.toResponseDto`.

**Response shape:** `items` (communications with recipients), `total`, `page`, `pageSize`, and `totalPages`.

### `GET /processes/communications/:communicationId/summary` — Generate AI Summary for a Communication

Handled by [summarize-communication.controller.ts](controllers/summarize-communication.controller.ts) and executed by [summarize-communication-usecase.ts](use-cases/summarize-communication-usecase.ts).

**Purpose:** generate a plain-language summary of a judicial communication using an LLM, persist it on the communication row, and return it. Subsequent requests for the same communication return the cached summary without hitting the LLM.

**Parameters:**
- `communicationId` *(route param)* — UUID of the target communication. No body is required — the communication (and its recipients) is loaded from the database.

**Flow:**
1. The use case calls `processRepository.findCommunicationById(communicationId)` (which eager-loads recipients); if the record does not exist it throws `NotFoundException`.
2. If the stored `aiSummary` is already populated, it is returned immediately (`cached: true`) — the LLM is **not** called.
3. Otherwise the use case composes a prompt (fixed system instructions + structured user content built from the persisted communication and its recipients) and delegates generation to the `IAIDriver` contract, adapted by `GroqAIDriver` using the model configured via `GROQ_MODEL`.
4. The returned text is persisted through `processRepository.updateCommunicationAiSummary` and exposed in the response (`cached: false`).

**AI integration:** the LLM is consumed through the agnostic [`IAIDriver`](../../drivers/ai/contracts/ai-driver.ts) contract provided by the [AI driver module](../../drivers/ai/ai.md). Swapping providers (Groq → OpenAI, Anthropic, etc.) only requires a new adapter — consumers are unaffected.

**Response shape:** `{ id: string, aiSummary: string, cached: boolean }`.

## Repository Contract

Defined in [contracts/process-repository.ts](repository/contracts/process-repository.ts):

```ts
interface IProcessRepository {
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
```

`PaginatedResult<T>` is the canonical pagination envelope (`items`, `total`, `page`, `pageSize`) used by both use cases.

## Validation

Input validation is centralized in Zod schemas under [dtos/](dtos/). `page` is parsed from the query string into a positive integer, optional filters are normalized, and date boundaries are coerced into `Date` instances via a single `transform` that emits Zod issues for malformed ISO strings.

## Security

- Both endpoints require a valid JWT via `JwtAuthGuard`.
- Raw SQL filters are always passed through `Prisma.sql` tagged fragments — user-supplied values are bound as parameters, preventing SQL injection.
- Response DTOs own the output shape explicitly, so no Prisma record is ever returned directly.

## Testing

Unit tests live in [tests/](tests/) and mirror the source layout:

- **Use cases** are tested in isolation by mocking `IProcessRepository`, covering the happy path, the empty-result case, and the `NotFoundException` branch when the target process does not exist.
- **Controllers** are tested by mocking the use case, verifying that query/route parameters are forwarded correctly and that errors propagate upward.

All tests run under Vitest and do not require a database connection.
