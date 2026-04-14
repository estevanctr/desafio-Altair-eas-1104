"use server";

import { signIn as nextAuthSignIn } from "@/configs/auth/auth";

export type SignInRequest = { email: string; password: string };
export type SignInResponse = { error: boolean; message?: string };

export async function signIn({
  email,
  password,
}: SignInRequest): Promise<SignInResponse> {
  try {
    await nextAuthSignIn("credentials", { email, password, redirect: false });
    return { error: false };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha ao autenticar";
    return { error: true, message };
  }
}
