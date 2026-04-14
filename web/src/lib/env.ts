import { z } from "zod";

const schema = z.object({
  API_HOST: z.url(),
  AUTH_SECRET: z.string().min(32),
});

type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!cached) cached = schema.parse(process.env);
    return cached[prop as keyof Env];
  },
});
