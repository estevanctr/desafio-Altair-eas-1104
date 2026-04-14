import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { authConfig } from "@/configs/auth/auth.config";
import { env } from "@/lib/env";
import { CredentialsWrong } from "@/errors/CredentialsWrong";

declare module "next-auth" {
  interface User {
    accessToken: string;
  }
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) throw new CredentialsWrong();

        const endpoint = new URL("auth/login", env.API_HOST);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });

        if (!response.ok) return null;

        const data = await response.json();
        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
});
