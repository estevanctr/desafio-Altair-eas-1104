import { NextResponse } from "next/server";
import { auth } from "@/configs/auth/auth";
import type { CustomMiddleware } from "./chain";

const PUBLIC_PREFIXES = ["/auth", "/api/auth"];
const PUBLIC_FILE_EXT = [".webp", ".png", ".svg", ".jpg", ".jpeg", ".ico"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_FILE_EXT.some((ext) => pathname.endsWith(ext))) return true;
  return false;
}

export function withAuthMiddleware(
  middleware: CustomMiddleware,
): CustomMiddleware {
  return async (request, event, response) => {
    const { pathname } = request.nextUrl;

    if (isPublic(pathname)) {
      return middleware(request, event, response);
    }

    const session = await auth();
    if (!session) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return middleware(request, event, response);
  };
}
