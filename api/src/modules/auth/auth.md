# Auth Module

Module responsible for the API's stateless authentication via JWT signed with asymmetric keys (RS256). Exposes the login endpoint and the `JwtAuthGuard` used by other modules to protect routes.

---

## Structure

```
src/modules/auth/
├── auth.module.ts                     ← Wiring (async JwtModule, providers, exports)
├── auth.md                            ← This document
├── configs/
│   ├── jwt.strategy.ts                ← Passport strategy (parse + Zod validation)
│   ├── jwt-auth.guard.ts              ← Guard that applies the strategy
│   └── current-user.decorator.ts      ← Extracts request.user in the controller
├── services/
│   └── token.service.ts               ← Token generation and verification
├── use-cases/
│   └── authenticate-usecase.ts        ← Validates credentials and issues a token
├── controllers/
│   └── authenticate.controller.ts     ← POST /auth/login
├── dtos/
│   ├── auth-request-dto.ts            ← Input schema (email + password)
│   └── auth-response-dto.ts           ← Response shape
└── tests/
    ├── controllers/
    ├── services/
    ├── use-cases/
    ├── jwt.strategy.spec.ts
    └── jwt-auth.guard.spec.ts
```

---

## Authentication flow

```
POST /auth/login  { email, password }
        │
        ▼
AuthenticateController
        │
        ▼
AuthenticateUseCase
  1. IUserRepository.findByEmail(email)
  2. IHashDriver.compare(password, user.password)
  3. TokenService.generateAccessToken({ sub, email, name })
        │
        ▼
200 OK  { accessToken, user: { id, name, email } }
```

## Authorization flow

```
GET /protected-route   Authorization: Bearer <token>
        │
        ▼
JwtAuthGuard  →  JwtStrategy.validate()
  – ExtractJwt.fromAuthHeaderAsBearerToken()
  – Verifies the signature with the public key (RS256)
  – Validates the payload shape with Zod (tokenSchema)
  – Populates request.user
        │
        ▼
Controller receives @CurrentUser() user: TokenSchema
```

---

## Components

### `TokenService` ([services/token.service.ts](services/token.service.ts))

Wraps Nest's `JwtService`. Reads `JWT_ACCESS_TOKEN_EXPIRES_IN` via `ConfigService` in the constructor.

- `generateAccessToken(payload)` — signs with RS256 using the configured expiration.
- `verifyAccessToken(token)` — verifies the signature and returns the typed payload.

### `JwtStrategy` ([configs/jwt.strategy.ts](configs/jwt.strategy.ts))

Extends `PassportStrategy(Strategy)` from `passport-jwt`. Configured with:

- `jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()` — only reads from the `Authorization` header.
- `algorithms: ['RS256']` — rejects downgrade attempts to `HS256`/`none`.
- `secretOrKey`: public key (base64 → Buffer) read via `ConfigService`.

The `validate()` method applies `tokenSchema.parse(payload)` (Zod) as a second validation layer over the cryptographically verified payload.

**Payload:** `{ sub, email, name }`. The project does not model `role`/`is_active` on the `User` (see [schema.prisma](../../../prisma/schema.prisma)), so the payload is limited to the fields that actually exist.

### `JwtAuthGuard` ([configs/jwt-auth.guard.ts](configs/jwt-auth.guard.ts))

Extends `AuthGuard('jwt')` and overrides `handleRequest` to differentiate:

- `TokenExpiredError` → `401 "Token has expired"`
- `JsonWebTokenError` → `401 "Invalid token"`
- other errors → rethrown
- no user → `401 "Unauthorized"`

### `@CurrentUser` ([configs/current-user.decorator.ts](configs/current-user.decorator.ts))

Param decorator that returns `request.user` typed as `TokenSchema`.

### `AuthenticateUseCase` ([use-cases/authenticate-usecase.ts](use-cases/authenticate-usecase.ts))

Depends on `IUserRepository` (from [user.module.ts](../user/user.module.ts)) and `IHashDriver` (from [hash.module.ts](../../drivers/hash/hash.module.ts)).

**Security:** returns the same message (`"Invalid credentials"`) for a missing email and a wrong password, preventing user enumeration.

---

## Wiring ([auth.module.ts](auth.module.ts))

- `JwtModule.registerAsync({ global: true })` — RSA keys read from `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` (base64) via `ConfigService`, with `signOptions.algorithm = 'RS256'`.
- Imports `UserModule` (provides `'IUserRepository'`) and `HashModule` (provides `'IHashDriver'`).
- Providers: `JwtStrategy`, `JwtAuthGuard`, `TokenService`, `AuthenticateUseCase`.
- Exports: `JwtAuthGuard`, `TokenService` — other modules that import `AuthModule` can use the guard directly.

---

## Environment variables

| Variable | Description |
|---|---|
| `JWT_PRIVATE_KEY` | Base64-encoded RSA private key (used to sign) |
| `JWT_PUBLIC_KEY` | Base64-encoded RSA public key (used to verify) |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | Access token expiration (default `2h`) |

All validated in [src/env.ts](../../env.ts) by the Zod schema.

**Generate an RSA 2048 key pair:**

```bash
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem
base64 -i private.pem   # → JWT_PRIVATE_KEY
base64 -i public.pem    # → JWT_PUBLIC_KEY
```

---

## Protecting an endpoint

```typescript
import { JwtAuthGuard } from '@/modules/auth/configs/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/configs/current-user.decorator';
import type { TokenSchema } from '@/modules/auth/configs/jwt.strategy';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourceController {
  @Get()
  list(@CurrentUser() user: TokenSchema) {
    // user.sub, user.email, user.name
  }
}
```

The module that declares the controller must import `AuthModule`. An example is already applied in [update-user-password.controller.ts](../user/controllers/update-user-password.controller.ts), with the guard applied at the class level.

---

## Tests

Unit coverage under [tests/](tests/):

- **use case** — valid credentials, missing user, wrong password, error-message parity.
- **token service** — signing with the expiration read from env, verification delegated to `JwtService`.
- **guard** — success, `TokenExpiredError`, `JsonWebTokenError`, unexpected error, no user.
- **strategy** — successful parse, missing fields, wrong field type (Zod).
- **controller** — forwards `email`/`password` to the use case and propagates errors.

Run with: `npm test`.
