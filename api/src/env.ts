import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
  NODE_ENV: z
    .enum(['local', 'development', 'staging', 'production'])
    .default('local'),

  DATABASE_URL: z.url(),

  HASH_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  PROCESS_COMMUNICATIONS_API_URL: z.url(),

  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default('2h'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
