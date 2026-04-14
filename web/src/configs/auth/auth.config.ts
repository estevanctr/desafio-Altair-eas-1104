import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";

export const authConfig = {
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 2 },
  pages: { signIn: "/auth/login" },
  providers: [],
  callbacks: {
    async jwt({ user, token, trigger, session }) {
      if (user) return { ...token, ...user };
      if (trigger === "update" && session) {
        return { ...token, accessToken: session.accessToken };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) session.user = token.user as typeof session.user;
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
