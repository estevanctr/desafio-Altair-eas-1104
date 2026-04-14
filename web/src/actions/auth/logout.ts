"use server";

import { signOut } from "@/configs/auth/auth";

export async function logout() {
  await signOut({ redirect: true, redirectTo: "/auth/login" });
}
