# JusCash API

This is the central API for the JusCash project. It manages users, authentication, judicial processes, and synchronizes judicial communications from external APIs.

## Project Architecture and Modules

The project is structured into domain-specific modules, following Clean Architecture principles (Controllers → Use Cases → Repositories → Domains).

For an in-depth understanding of how each core module works, please refer to their respective documentation files:

- **[User Module](src/modules/user/user.md)**: Manages user accounts, creation, and password updates.
- **[Auth Module](src/modules/auth/auth.md)**: Handles stateless authentication via JWT signed with asymmetric keys (RS256).
- **[Process Module](src/modules/process/process.md)**: Exposes read endpoints for judicial processes and their communications.
- **[Update Processes Scheduler Module](src/modules/update-processes-scheduler/update-processes-scheduler.md)**: A worker/scheduler that fetches, processes, and stores judicial communications from the public PJe API.

> **Note:** Every module under [src/modules/](src/modules/) ships with its own `<module-name>.md` file that documents the module's responsibilities, endpoints, repository contracts, validation rules, and testing strategy. Always check the module's `.md` file before modifying it.

### Global Exception Filter

All HTTP errors flow through a single [GlobalExceptionFilter](src/common/filters/global-exception.filter.ts), registered globally in [main.ts](src/main.ts). It normalizes every response body to a consistent shape:

```json
{
  "error": {
    "timestamp": "2026-04-14T12:00:00.000Z",
    "code": 400,
    "message": "..."
  }
}
```

The filter handles three cases:

- **`ZodError`** — returned by `nestjs-zod` validation pipes. Mapped to `400 Bad Request`, with `message` containing the flattened `fieldErrors` so clients can highlight invalid inputs per field.
- **`HttpException`** — any Nest-thrown exception (`NotFoundException`, `UnauthorizedException`, etc.) preserves its original status and message.
- **Unknown exceptions** — mapped to `500 Internal Server Error` with a generic message. The full stack trace is logged via Nest's `Logger` so the client never sees internal details.

This keeps controllers and use cases free of try/catch boilerplate — they can throw domain/HTTP exceptions and trust the filter to serialize them safely.

### API Documentation (Swagger)

The API exposes an interactive OpenAPI documentation powered by [Swagger](https://swagger.io/), configured in [main.ts](src/main.ts) via `@nestjs/swagger`. Once the application is running, the Swagger UI is available at:

```
http://localhost:3333/docs
```

From there you can explore every endpoint, view request/response schemas (generated automatically from the Zod DTOs via `nestjs-zod`), and try out authenticated routes using the `Authorize` button with a JWT obtained from `POST /auth/login`.

### Code Style and Linting

The project uses [Biome](https://biomejs.dev/) as a single tool for linting, formatting, and import sorting (replacing ESLint + Prettier). Configuration lives in [biome.json](biome.json) and is tuned for a NestJS backend:

- Parameter decorators enabled (`unsafeParameterDecoratorsEnabled`) so `@Inject()` in constructors parses correctly.
- `noExplicitAny` and `noEmptyBlockStatements` disabled — required by Nest patterns like empty constructors and decorator metadata.
- React/a11y/JSX rules stripped out since this is a pure backend.
- Ignores `generated/` (Prisma client), `dist/`, and `coverage/`.

Commands:

```bash
npm run lint      # biome check --write  (lint + format + organize imports)
npm run format    # biome format --write (format only)
```

### AI Assistant Skills (Claude)

This project includes a custom AI skill configuration located at `[.claude/skills/nestjs-module-architecture/SKILL.md](.claude/skills/nestjs-module-architecture/SKILL.md)`. This skill guides AI assistants on how to scaffold and manage NestJS modules following the project's specific Clean Architecture patterns, ensuring that AI-generated code natively understands and implements our strict separation of layers (Controllers, Use Cases, Repositories, Mappers, DTOs).

## Running the Project

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed on your machine.
- [Node.js](https://nodejs.org/) (version 22+ recommended) for local development without Docker.

### Environment Setup

1. Navigate into the repository folder.
2. Create your `.env` file by copying the provided example:
   ```bash
   cp env.example .env
   ```
3. Fill in the required environment variables in the `.env` file (e.g., Database credentials, JWT asymmetric keys, etc.).
   > _Note: For generating RSA keys for the Auth module, check the [Auth Module documentation](src/modules/auth/auth.md)._

### Using Docker (Recommended)

The easiest way to run the database and the API together is using Docker Compose.

1. Build and start the containers:

   ```bash
   docker-compose up -d --build
   ```

2. The API will be available at `http://localhost:3333` (or the port defined by `API_PORT` in your `.env` file). The Postgres database will be available on the configured port.

3. To view the application logs:

   ```bash
   docker-compose logs -f api
   ```

4. To stop the containers:
   ```bash
   docker-compose down
   ```

### Local Development (Without Docker for the API)

If you prefer to run the application locally (useful for debugging):

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start only the PostgreSQL database using Docker:

   ```bash
   docker-compose up -d postgres
   ```

3. Generate the Prisma Client and run migrations:

   ```bash
   npx prisma generate
   # if you need to run migrations: npx prisma migrate deploy
   ```

4. Start the application:

   ```bash
   # development
   npm run start

   # watch mode
   npm run start:dev
   ```

## Database Seeding

To populate your database with initial or test data, you can run the Prisma seed script. Make sure your database is running and migrations have been applied before running this command.

If you are using **Docker** and haven't installed dependencies locally, run it inside the API container:

```bash
docker-compose exec api npx prisma db seed
```

## Running Tests

The application uses Vitest for testing. You can run tests using the following commands:

```bash
# unit tests
npm run test

# watch mode
npm run test:watch

# test coverage
npm run test:cov

## Built With

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Vitest](https://vitest.dev/)
- [Docker](https://www.docker.com/)
```
