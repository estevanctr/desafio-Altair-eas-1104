# Altair Challenge

Monorepo containing the API ([api/](api/)) and the web front-end ([web/](web/)).

## Prerequisites

- Docker and Docker Compose

## Configuration

Copy the example environment file and adjust the values as needed:

```bash
cp .env.example .env
```

## Running the projects

From the repository root, run:

```bash
docker compose up --build
```

This starts three services: `postgres`, `api`, and `web`. The exposed ports are defined in `.env`.

## Running the API migrations and seeds

With the containers running, first apply the database migrations and then execute the seeds inside the API container:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

## Architecture

For more details about each project's architecture, see the individual READMEs:

- [api/README.md](api/README.md)
- [web/README.md](web/README.md)
