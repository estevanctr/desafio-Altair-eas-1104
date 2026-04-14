# AI Module

Module responsible for providing **text completion** capabilities to the rest of the application in a vendor-agnostic way.

It follows the same **Driver + Adapter** pattern used by the [hash module](../hash/hash.md): consumers depend on the `IAIDriver` contract, never on a specific SDK. The current implementation adapts the **Groq SDK** (`llama-3.3-70b-versatile`), but it can be swapped for any other LLM provider without touching consumer code.

---

## Folder Structure

```
ai/
├── contracts/
│   └── ai-driver.ts       # IAIDriver interface (public contract)
├── groq-ai-driver.ts      # Concrete adapter implementing IAIDriver on top of groq-sdk
├── ai.module.ts           # NestJS module (DI + exports)
└── ai.md                  # This file
```

---

## Architecture

### 1. Contract (`contracts/ai-driver.ts`)

```ts
export interface AICompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AICompletionMessage[];
}

export interface IAIDriver {
  generateCompletion(request: AICompletionRequest): Promise<string>;
}
```

Consumers depend **exclusively** on this interface. This guarantees:

- Dependency inversion — consumers are unaware of Groq/OpenAI/etc.
- Trivial mocking in unit tests.
- Freedom to swap providers (Groq → OpenAI, Anthropic, local model, …) without refactors.

### 2. Implementation (`groq-ai-driver.ts`)

`GroqAIDriver` is the adapter that implements `IAIDriver` on top of `groq-sdk`:

- Reads `GROQ_API_KEY` from the validated `ConfigService`.
- Calls `chat.completions.create` with the fixed model `llama-3.3-70b-versatile`.
- Returns the trimmed content of the first choice.

### 3. Module (`ai.module.ts`)

Registers the provider using the string token `'IAIDriver'`:

```ts
providers: [{ provide: 'IAIDriver', useClass: GroqAIDriver }],
exports: ['IAIDriver'],
```

Consumers inject it via:

```ts
constructor(@Inject('IAIDriver') private readonly ai: IAIDriver) {}
```

---

## Usage

Import `AIModule` into the consuming module and inject the driver:

```ts
@Module({
  imports: [AIModule],
  providers: [SummarizeCommunicationUseCase],
})
export class ProcessModule {}
```

```ts
const summary = await this.ai.generateCompletion({
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Summarize this text: …' },
  ],
});
```

---

## Environment

| Variable       | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `GROQ_API_KEY` | API key used by the Groq SDK for authentication.                     |
| `GROQ_MODEL`   | Groq model identifier (e.g. `llama-3.3-70b-versatile`). Injected into the adapter so the model can be swapped without code changes. |

Validation happens at startup through the central Zod schema in [`src/env.ts`](../../env.ts).
