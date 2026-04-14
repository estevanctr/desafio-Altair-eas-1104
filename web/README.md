# Web — Processes Management Frontend

A [Next.js](https://nextjs.org) 16 application (App Router) that provides the user-facing interface for the Processes Management system. It handles authentication, renders the processes list, and consumes the backend API located in the sibling [`../api`](../api) project.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Authentication:** [NextAuth v5 (Auth.js)](https://authjs.dev) with credentials provider
- **Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- **Data fetching:** TanStack Query v5 + a custom HTTP adapter wrapping `fetch`
- **Validation:** Zod (forms and environment variables)
- **Icons / UX:** lucide-react, sonner (toasts)

## Architecture Overview

The `src/` folder is organized by responsibility rather than by feature, keeping the boundary between UI, data access, and infrastructure explicit:

```
src/
├── app/                  # Next.js App Router (routes, layouts, API route handlers)
│   ├── (home)/           # Authenticated area (processes list, app shell)
│   ├── auth/             # Public routes: login and signUp
│   └── api/              # Route handlers (NextAuth, processes proxy)
├── actions/              # Server Actions (e.g. auth flows)
├── adapter/              # HTTP adapter abstraction (fetch.adapter, http.adapter)
├── components/           # Reusable UI: app shell, sidebar, processes, shadcn/ui primitives
├── configs/              # Third-party configuration (NextAuth options)
├── context/              # React context providers (TanStack Query provider)
├── hooks/                # Custom hooks (e.g. use-processes)
├── lib/                  # Pure utilities (cn, env validation, html-to-text)
├── middlewares/          # Composable route middlewares (auth chain)
├── constants/            # Shared constants
├── errors/               # Domain/HTTP error classes
└── types/                # Shared TypeScript types
```

### Key architectural decisions

- **App Router + Route Groups.** `(home)` isolates authenticated layouts and keeps the public `auth/` routes free of the app shell.
- **Middleware chaining.** `middlewares/chain.ts` composes middlewares so that new cross-cutting concerns can be added without touching `withAuthMiddleware`.
- **HTTP Adapter pattern.** All network calls flow through `adapter/http.adapter.ts`, implemented by `fetch.adapter.ts`. This decouples feature code from `fetch` and makes it trivial to swap transport, add interceptors, or mock in tests.
- **Server Actions for mutations.** Authentication flows (login, signup) live in `src/actions/auth`, running on the server to keep secrets and session handling out of the client bundle.
- **Client-side data with TanStack Query.** Read flows (e.g. processes list) are handled via hooks in `src/hooks/` wrapped by the provider in `src/context/query-provider.tsx` for caching, retries, and pagination.
- **Validated environment.** `src/lib/env.ts` parses `process.env` with Zod at startup, so missing or invalid variables fail fast.

## Getting Started

### Prerequisites

- Node.js 20+
- A running instance of the backend API (see [`../api`](../api))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the root of `web/`:

```env
# URL of the backend API (see ../api)
API_HOST="http://localhost:3333"

# NextAuth secret — must be at least 32 characters
# Generate one with: openssl rand -base64 32
AUTH_SECRET="replace-with-a-secure-random-string"
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script          | Description                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Start the Next.js development server |
| `npm run build` | Create a production build            |
| `npm run start` | Run the production build             |
| `npm run lint`  | Run ESLint across the project        |

## Project Conventions

- **Path aliases:** imports use `@/*` which maps to `src/*` (see `tsconfig.json`).
- **UI primitives:** components in `components/ui/` are generated via the `shadcn` CLI — prefer composing them over writing raw markup.
- **Styling:** utility-first with Tailwind; use the `cn` helper from `lib/cn.ts` to merge class names safely.
- **Validation:** forms and environment variables are validated with Zod schemas — never trust unvalidated input.
- **Errors:** throw the typed errors in `src/errors/` from adapters and server actions; the UI surfaces them via `sonner` toasts.
