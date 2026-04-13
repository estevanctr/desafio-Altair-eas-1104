# JusCash API

This is the central API for the JusCash project. It manages users, authentication, judicial processes, and synchronizes judicial communications from external APIs.

## Project Architecture and Modules

The project is structured into domain-specific modules, following Clean Architecture principles (Controllers → Use Cases → Repositories → Domains). 

For an in-depth understanding of how each core module works, please refer to their respective documentation files:

- **[User Module](src/modules/user/user.md)**: Manages user accounts, creation, and password updates.
- **[Auth Module](src/modules/auth/auth.md)**: Handles stateless authentication via JWT signed with asymmetric keys (RS256).
- **[Process Module](src/modules/process/process.md)**: Exposes read endpoints for judicial processes and their communications.
- **[Update Processes Scheduler Module](src/modules/update-processes-scheduler/update-processes-scheduler.md)**: A worker/scheduler that fetches, processes, and stores judicial communications from the public PJe API.

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
   > *Note: For generating RSA keys for the Auth module, check the [Auth Module documentation](src/modules/auth/auth.md).*

### Using Docker (Recommended)

The easiest way to run the database and the API together is using Docker Compose.

1. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```

2. The API will be available at `http://localhost:3000` (or the port defined in your `.env` file). The Postgres database will be available on the configured port.

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
