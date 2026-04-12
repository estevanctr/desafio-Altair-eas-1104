# Hash Module

Module responsible for providing **hashing** and **verification** capabilities for sensitive values (passwords, tokens, etc.) in an isolated and replaceable way across the application.

This module follows the **Driver** pattern (an abstraction over an external library), allowing the concrete implementation (currently `bcrypt`) to be swapped without impacting consumers.

---

## Folder Structure

```
hash/
├── contracts/
│   └── hash-driver.ts      # IHashDriver interface (public contract)
├── tests/
│   └── hash-driver.spec.ts # Unit tests (Vitest)
├── hash-driver.ts          # Concrete implementation using bcrypt
├── hash.module.ts          # NestJS module (DI + exports)
└── README.md               # This file
```

---

## Architecture

The solution is built on three well-defined layers:

### 1. Contract (`contracts/hash-driver.ts`)

Defines the `IHashDriver` interface, exposing only what consumers need:

```ts
export interface IHashDriver {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
```

Consumers depend **exclusively** on this interface — never on the concrete implementation. This ensures:

- **Dependency inversion** (the "D" in SOLID);
- Easy mocking and testing of consumers;
- Freedom to swap the underlying library (bcrypt → argon2, scrypt, etc.).

### 2. Implementation (`hash-driver.ts`)

`HashDriver` is the concrete class that implements `IHashDriver` using **bcrypt**:

- `SALT_ROUNDS = 10` — fixed computational cost, balancing security and performance.
- `hash(plain)` — generates a hash with an embedded random salt.
- `compare(plain, hashed)` — verifies whether a plain value matches a previously generated hash.

The class is decorated with `@Injectable()` so it can participate in NestJS's DI container.

### 3. Module (`hash.module.ts`)

`HashModule` registers the provider using the string token `'IHashDriver'`:

```ts
providers: [{ provide: 'IHashDriver', useClass: HashDriver }],
exports: ['IHashDriver'],
```

Since TypeScript does not preserve interfaces at runtime, we use a **string token** to bind the abstraction to its implementation. Consumers inject it via:

```ts
constructor(@Inject('IHashDriver') private readonly hash: IHashDriver) {}
```

---

## Usage

Just import `HashModule` into the consuming module:

```ts
@Module({
  imports: [HashModule],
  providers: [CreateUserUseCase],
})
export class UserModule {}
```

And inject the driver:

```ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('IHashDriver') private readonly hashDriver: IHashDriver,
  ) {}

  async execute(password: string) {
    const hashed = await this.hashDriver.hash(password);
    // ...
  }
}
```

---

## Tests

Unit tests live in [tests/hash-driver.spec.ts](tests/hash-driver.spec.ts) and use **Vitest**.

Current coverage:

| Method    | Scenario                                     |
| --------- | -------------------------------------------- |
| `hash`    | Generates a hash from a plain string         |
| `hash`    | Produces distinct hashes for the same input  |
| `hash`    | Output format is a valid bcrypt hash         |
| `compare` | Returns `true` when the value matches        |
| `compare` | Returns `false` when the value does not match|
| `compare` | Returns `false` for an invalid hash          |

To run only this module's tests:

```bash
npx vitest run src/drivers/hash
```

---

## Design Decisions

- **Why bcrypt?** Mature, widely audited algorithm with native per-hash salt support.
- **Why 10 rounds?** Safe default recommended by OWASP for 2024+, balancing response time (~100ms) and brute-force resistance.
- **Why a Driver instead of using bcrypt directly?** Isolates the external dependency, makes the application testable, and allows future swaps without cascading refactors.
- **Why a string token (`'IHashDriver'`)?** TypeScript interfaces do not exist at runtime — a string token is the canonical DI approach for abstractions in NestJS.
