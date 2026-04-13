---
name: nestjs-module-architecture
description: >
  Generates NestJS modules following a hybrid architecture with elements of MVC and Clean Architecture,
  with well-defined layers (Controller → Use Case → Repository → Domain). Use this skill whenever the
  user asks to create a module, endpoint, CRUD, feature, resource, or entity in a NestJS project. Also
  trigger when the user mentions "create controller", "create use case", "create repository", "add
  endpoint", "new NestJS module", "scaffold NestJS", or any variation involving generating structured
  code for a NestJS API. Even if the user only asks for "a create endpoint", use this skill to ensure
  the full layered structure is generated correctly.
---

# NestJS Module Architecture

This skill generates complete NestJS modules following a hybrid architecture with elements of MVC and Clean Architecture. Each module is a vertical slice of the domain with clear separation of responsibilities.

## Layered Architecture

Dependencies always point inward — from the outermost layer (HTTP) to the innermost (domain):

```
HTTP Layer (Controller)  →  Application Layer (Use Case)  →  Infrastructure (Repository)  →  Domain (Types/Contracts)
```

## Directory Structure

Every generated module follows this structure:

```
src/modules/<module-name>/
├── <name>.module.ts                     ← Module wiring
├── controllers/
│   └── <action>-<name>.controller.ts    ← One controller per endpoint
├── use-cases/
│   └── <action>-<name>-usecase.ts       ← One use case per action
├── repository/
│   ├── <name>-repository.ts             ← Concrete implementation
│   ├── contracts/
│   │   └── <name>-repository.ts         ← Repository interface
│   └── mappers/
│       └── <name>-mapper.ts             ← ORM → domain type
├── dtos/
│   ├── <action>-<name>-request-dto.ts   ← Input validation (Zod)
│   └── <action>-<name>-response-dto.ts  ← Output transformation
└── types/
    ├── <name>-type.ts                   ← Domain type
    └── <name>-request-type.ts           ← Input parameter type
```

Fundamental rule: each action (create, update, delete, find, list) generates a separate controller + use case pair. Never group multiple actions in a single file.

## Rules per Layer

### Controller

The controller bridges HTTP and business logic. It contains no business rules.

Responsibilities:
- Apply authentication guards (`@UseGuards(AuthGuard)`)
- Use `@Body(ValidationPipe)` to validate input
- Extract data from the HTTP context (`@Param()`, `@Query()`, `@Body()`, `@CurrentUser()`)
- Execute high-level authorization checks (verify user role)
- Delegate all logic to the Use Case

Example:
```typescript
@Post()
@HttpCode(201)
@UseGuards(AuthGuard)
async handle(
  @Body(ValidationPipe) body: CreateEntityBodySchema,
  @CurrentUser() user: AuthenticatedUser,
): Promise<CreateEntityResponseDto> {
  if (!hasPermission(user, 'create:entity')) {
    throw new ForbiddenException('Access denied');
  }
  return this.createEntityUseCase.execute(body);
}
```

### Use Case

The use case orchestrates business logic. It knows nothing about HTTP or ORM.

Responsibilities:
- Receive typed parameters (from the request DTO)
- Consume only injected interfaces via `@Inject('IToken')` — never direct implementations
- Execute domain validations (uniqueness, existence, business rules)
- Throw NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.)
- Return the response DTO

Example:
```typescript
@Injectable()
export class CreateEntityUseCase {
  constructor(
    @Inject('IEntityRepository') private entityRepository: IEntityRepository,
  ) {}

  async execute(data: EntityRequest): Promise<CreateEntityResponseDto> {
    const existing = await this.entityRepository.findByUniqueField(data.uniqueField);
    if (existing) {
      throw new ConflictException('Resource already exists');
    }
    const entity = await this.entityRepository.create(data);
    return CreateEntityResponseDto.toResponseDto(entity);
  }
}
```

### Repository

The repository handles database access. It contains no business logic.

Responsibilities:
- Implement the contract interface (`IEntityRepository`)
- Use the DatabaseService (ORM/query builder) for persistence
- Use the Mapper to convert ORM type → domain type

### Interface (Contract)

Every dependency between layers goes through an interface, never a concrete implementation. This enables unit tests with mocks and ORM swaps without breaking the use case.

The interface lives in `repository/contracts/` and contains only method signatures. Return types use domain types (never ORM types). The interface imports nothing from the ORM, NestJS, or any framework.

```typescript
export interface IEntityRepository {
  create(data: EntityRequest): Promise<EntityType>;
  findById(id: string): Promise<EntityType | null>;
  findByUniqueField(value: string): Promise<EntityType | null>;
}
```

### Mapper

Converts the ORM-returned type into the domain type. Isolates database naming from domain naming. Lives in `repository/mappers/`.

```typescript
export class EntityMapper {
  static toDomain(ormRecord: OrmEntityPayload): EntityType {
    return {
      id: ormRecord.id,
      name: ormRecord.name,
      internal_token: ormRecord.token_hash, // explicit renaming
      status: ormRecord.status as EntityStatus,
      created_at: ormRecord.created_at,
      updated_at: ormRecord.updated_at,
    };
  }
}
```

## DTOs

### Request DTO (Input Validation)

Uses Zod via `nestjs-zod` for validation. Shared helpers live in `src/common/utils/zod-helpers.ts`.

```typescript
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { requiredString, uuidSchema } from '@/common/utils/zod-helpers';

export const CreateEntityBodySchema = z.object({
  name: requiredString('name'),
  external_id: uuidSchema.optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type CreateEntityBodySchema = z.infer<typeof CreateEntityBodySchema>;
export class CreateEntityRequestDto extends createZodDto(CreateEntityBodySchema) {}
```

### Response DTO (Output Transformation)

Class with a static `toResponseDto()` method that transforms the domain type into the API response. Always exclude sensitive fields. Explicitly list returned fields — avoid generic spreads. Never return the domain type directly.

```typescript
export class CreateEntityResponseDto {
  id: string;
  name: string;
  status: string;
  created_at: Date;
  updated_at: Date;

  static toResponseDto(entity: EntityType): CreateEntityResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
```

## Domain Types

Represent internal entities, independent of database or HTTP. Use TypeScript `type` (not `class` or `interface` for pure data). Relations are optional (`?`) to support queries without include/join.

```typescript
export type EntityType = {
  id: string;
  name: string;
  internal_token: string; // sensitive field — never exposed in the API
  status: EntityStatus;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  related_items?: RelatedItemType[];
};
```

## Dependency Injection with Tokens

TypeScript erases interfaces at runtime, so use string tokens for DI. This is mandatory.

In the module:
```typescript
providers: [
  { provide: 'IEntityRepository', useClass: EntityRepository },
],
exports: ['IEntityRepository'], // export the token, not the class
```

In the use case:
```typescript
constructor(
  @Inject('IEntityRepository') private entityRepository: IEntityRepository,
) {}
```

Cross-module: module A exports the token in `exports`, module B imports `ModuleA` in `imports`.

## Module Wiring

The `<name>.module.ts` file connects all the pieces:

```typescript
@Module({
  imports: [OtherModule],
  controllers: [CreateEntityController],
  providers: [
    DatabaseService,
    CreateEntityUseCase,
    { provide: 'IEntityRepository', useClass: EntityRepository },
  ],
  exports: ['IEntityRepository'],
})
export class EntityModule {}
```

The `DatabaseService` is declared locally in each module that needs it. Always use `provide/useClass` with a string token. Export the string token, not the class. Import the full module to receive its exports.

## Authentication and Authorization

- Apply `@UseGuards(AuthGuard)` on all protected endpoints
- Use `@CurrentUser() user: AuthenticatedUser` to extract the user payload
- Sensitive fields are excluded in the Response DTO

## Generation Checklist

When generating a module, ensure all these items are present:

- Directory following the standard structure
- One controller per action
- One use case per action
- Domain type in `types/`
- Interface in `repository/contracts/`
- Concrete implementation in `repository/`
- Mapper in `repository/mappers/`
- Request DTO with Zod schema in `dtos/`
- Response DTO with static `toResponseDto()` in `dtos/`
- Module wiring with `provide/useClass` and string token
- Authentication guard on protected endpoints
- Sensitive fields excluded in the Response DTO
