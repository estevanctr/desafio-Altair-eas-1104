# User Module

The User Module is responsible for managing user accounts in the application. It exposes endpoints for creating new users and updating their passwords, following a layered architecture inspired by Clean Architecture and the Controller → Use Case → Repository flow.

## Architecture Overview

The module is organized into well-defined layers, each with a single responsibility:

```
user/
├── controllers/      # HTTP layer (NestJS controllers)
├── use-cases/        # Application business rules
├── repository/       # Data access layer
│   ├── contracts/    # Repository interfaces (ports)
│   └── mappers/      # Persistence ↔ domain translation
├── dtos/             # Request/response DTOs and Zod schemas
├── types/            # Domain types and request shapes
├── tests/            # Unit tests mirroring the source structure
└── user.module.ts    # NestJS module wiring
```

### Layer Responsibilities

- **Controllers** — Receive HTTP requests, validate input through `ZodValidationPipe`, and delegate execution to the corresponding use case. They never contain business logic.
- **Use Cases** — Encapsulate application business rules. They orchestrate repositories and drivers (such as the hash driver) to fulfill a single user-facing operation.
- **Repository** — Implements the `IUserRepository` contract using Prisma. The contract decouples the use cases from the persistence technology, making it easy to swap implementations or mock them in tests.
- **Mapper** — Converts raw Prisma records into domain objects (`UserType`), preventing persistence details from leaking into upper layers.
- **DTOs & Schemas** — Define the input/output shapes of the HTTP boundary using Zod (`nestjs-zod`), providing both runtime validation and TypeScript types.

## Dependency Injection

The module is wired in [user.module.ts](user.module.ts):

- `IUserRepository` is registered with the token `'IUserRepository'` and bound to the `UserRepository` Prisma implementation.
- `CreateUserUseCase` and `UpdateUserPasswordUseCase` are exposed as providers and re-exported so other modules (e.g. Auth) can reuse them.
- The module imports `HashModule`, which provides the `IHashDriver` used to hash and compare passwords.

## Endpoints

### `POST /users` — Create User

Handled by [create-user.controller.ts](controllers/create-user.controller.ts) and executed by [create-user-usecase.ts](use-cases/create-user-usecase.ts).

**Flow:**
1. The controller validates the request body against `CreateUserBodySchema` (`name`, `email`, `password`).
2. The use case checks whether a user with the given email already exists. If so, it throws `ConflictException`.
3. The plain-text password is hashed via `IHashDriver`.
4. The repository persists the new user.
5. The response is mapped to `CreateUserResponseDto`, which intentionally omits the password.

**Status:** `201 Created`

### `PATCH /users/:id/password` — Update Password

Handled by [update-user-password.controller.ts](controllers/update-user-password.controller.ts) and executed by [update-user-password-usecase.ts](use-cases/update-user-password-usecase.ts).

**Protected by `JwtAuthGuard`** — only authenticated users can call it.

**Flow:**
1. The controller validates the body (`currentPassword`, `newPassword`) and forwards the route param `id`.
2. The use case fetches the user by id; if missing, it throws `NotFoundException`.
3. It compares `currentPassword` against the stored hash. On mismatch, throws `UnauthorizedException`.
4. The new password is hashed and persisted via `userRepository.updatePassword`.
5. Returns `UpdateUserPasswordResponseDto` containing `id` and `updatedAt`.

**Status:** `200 OK`

## Repository Contract

Defined in [contracts/user-repository.ts](repository/contracts/user-repository.ts):

```ts
interface IUserRepository {
  create(data: CreateUserData): Promise<UserType>;
  findById(id: string): Promise<UserType | null>;
  findByEmail(email: string): Promise<UserType | null>;
  updatePassword(id: string, hashedPassword: string): Promise<UserType>;
}
```

The Prisma-based implementation lives in [user-repository.ts](repository/user-repository.ts) and always returns domain objects through `UserMapper.toDomain`.

## Validation

All input validation is centralized in Zod schemas under [dtos/](dtos/), with shared helpers (`emailSchema`, `passwordSchema`, `requiredString`) defined in [schemas/zod-helpers.ts](dtos/schemas/zod-helpers.ts). The `nestjs-zod` adapter exposes the schemas as DTO classes consumable by NestJS.

## Security

- Passwords are never stored in plain text; hashing is delegated to `IHashDriver` (provided by `HashModule`).
- Response DTOs explicitly exclude the password field.
- Password updates require both authentication (JWT) and re-confirmation of the current password.

## Testing

Unit tests live in [tests/](tests/) and mirror the source layout, covering controllers, use cases, the repository, and the mapper. Use cases are tested in isolation by mocking `IUserRepository` and `IHashDriver`, ensuring the business rules are verified independently of NestJS and Prisma.
