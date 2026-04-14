"use server";

import { z } from "zod";
import { FetchAdapter } from "@/adapter/fetch.adapter";

const schema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

export type SignUpRequest = z.infer<typeof schema>;
export type SignUpResponse =
  | { error: false }
  | { error: true; code?: "EMAIL_IN_USE"; message: string };

export async function signUp(input: SignUpRequest): Promise<SignUpResponse> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: true, message: "Dados inválidos" };
  }

  const http = new FetchAdapter();
  const response = await http.post("/users", parsed.data);

  if (!response.ok) {
    if (response.status === 409) {
      return { error: true, code: "EMAIL_IN_USE", message: "Email já cadastrado" };
    }
    const data = await response.json().catch(() => ({}));
    return { error: true, message: data.message ?? "Falha ao criar conta" };
  }

  return { error: false };
}
