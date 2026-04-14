import { z } from "zod";

const schema = z.object({
  API_HOST: z.url(),
  AUTH_SECRET: z.string().min(32),
});

export const env = schema.parse(process.env);
