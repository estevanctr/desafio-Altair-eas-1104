# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run build              # Production build
npm run lint               # Lint and auto-fix
npm run format             # Format with Prettier

# Testing
npm test                   # Run all unit tests
npm run test:watch         # Watch mode
npm run test:cov           # With coverage report
npm run test:e2e           # End-to-end tests
npx vitest run src/path/to/file.spec.ts          # Single test file
npx vitest run -t "test name pattern"            # Single test by name

# Database
npx prisma generate        # Regenerate Prisma client (after schema changes)
npx prisma migrate deploy  # Apply migrations
npx prisma db seed         # Seed database

# Docker (recommended for local dev)
docker-compose up -d postgres                    # Start only DB
docker-compose up -d --build                     # Start full stack
docker-compose exec api npx prisma db seed       # Seed inside container
```

## Architecture

This is a NestJS REST API for JusCash — a judicial case management system. It follows a **hybrid MVC + Clean Architecture** pattern.

### Request Flow

```
Controller → Use Case → Repository → Prisma (PostgreSQL)
```

Each layer has a strict responsibility:
- **Controllers** — HTTP in/out only, no business logic
- **Use Cases** — business orchestration, one class per operation
- **Repositories** — data access; implement a contract interface
- **Mappers** — convert Prisma ORM records to domain types

### Module Directory Structure

```
src/modules/<name>/
├── controllers/
├── use-cases/
├── repository/
│   ├── contracts/         # IRepository interface
│   ├── mappers/           # Prisma record → domain type
│   └── <name>-repository.ts
├── dtos/                  # Zod schemas (input) + Response DTOs (output)
├── types/                 # Domain types
├── tests/
├── <name>.module.ts
└── <name>.md              # Module architecture summary
```

Each module contains a `<name>.md` file that documents its purpose, layer responsibilities, endpoints, repository contract, validation rules, security notes, and testing strategy. Read it before modifying a module.

### Dependency Injection

Interfaces are erased at runtime, so repositories use **string tokens**:
```typescript
{ provide: 'IUserRepository', useClass: UserRepository }
```
Inject with: `@Inject('IUserRepository') private readonly repo: IUserRepository`

Never import interfaces as values — only as types.

### Key Modules

| Module | Responsibility |
|---|---|
| `user` | User creation, password updates |
| `auth` | JWT login (RS256 asymmetric), `JwtAuthGuard`, `@CurrentUser()` decorator |
| `process` | Paginated judicial process queries with filtering |
| `update-processes-scheduler` | Daily cron (01:00 UTC) that fetches from PJe Comunica API and persists processes/communications |

### Input/Output Conventions

- **Input validation:** Zod schemas via `nestjs-zod` (`ZodValidationPipe`)
- **Output:** Response DTOs with a static `toResponseDto()` factory — sensitive fields are excluded explicitly
- **Auth:** Add `@UseGuards(JwtAuthGuard)` to protected routes; current user available via `@CurrentUser()`

### Environment

Environment variables are validated at startup by a Zod schema in [src/env.ts](src/env.ts). Copy `.env.example` to `.env`. Key variables:

```
DATABASE_URL
JWT_PRIVATE_KEY          # base64-encoded RSA private key
JWT_PUBLIC_KEY           # base64-encoded RSA public key
PROCESS_COMMUNICATIONS_API_URL
HASH_SALT_ROUNDS         # 4–15
```

Generate RSA keys:
```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
base64 -i private.pem   # → JWT_PRIVATE_KEY
base64 -i public.pem    # → JWT_PUBLIC_KEY
```

### Database Schema (Prisma)

`User → (none)` | `Process → Communication → Recipient`

Generated client outputs to `generated/prisma/client` (non-standard path — always run `npx prisma generate` after schema changes).

### API Endpoints

- `POST /auth/login` — public
- `POST /users` — public
- `PATCH /users/:id/password` — protected
- `GET /processes` — protected, paginated
- `GET /processes/:processId/communications` — protected
- `GET /docs` — Swagger UI

### Custom Skill

There is a custom NestJS module generation skill at [.claude/skills/nestjs-module-architecture/SKILL.md](.claude/skills/nestjs-module-architecture/SKILL.md). Use it when asked to scaffold a new module, endpoint, or CRUD — it enforces the project's layered conventions.
