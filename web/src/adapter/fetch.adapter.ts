import { auth, signOut } from "@/configs/auth/auth";
import { env } from "@/lib/env";
import type { HttpAdapter } from "./http.adapter";

export class FetchAdapter implements HttpAdapter {
  private setUrl(endpoint: string): string {
    const base = env.API_HOST.endsWith("/") ? env.API_HOST : `${env.API_HOST}/`;
    const path = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    return new URL(path, base).toString();
  }

  private async setHeaders(extra?: HeadersInit, json = true): Promise<Headers> {
    const headers = new Headers(extra);
    if (json && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const session = await auth();
    if (session?.accessToken) {
      headers.set("Authorization", `Bearer ${session.accessToken}`);
    }
    return headers;
  }

  private async handle(response: Response): Promise<Response> {
    if (response.status === 401) {
      await signOut({ redirect: true, redirectTo: "/auth/login" });
      throw new Error("SESSION_EXPIRED");
    }
    return response;
  }

  async get(input: string, init?: RequestInit): Promise<Response> {
    const headers = await this.setHeaders(init?.headers, false);
    const response = await fetch(this.setUrl(input), {
      ...init,
      method: "GET",
      headers,
    });
    return this.handle(response);
  }

  async post(
    input: string,
    body: Record<string, unknown>,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = await this.setHeaders(init?.headers);
    const response = await fetch(this.setUrl(input), {
      ...init,
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return this.handle(response);
  }

  async put(
    input: string,
    body: Record<string, unknown>,
    init?: RequestInit,
  ): Promise<Response> {
    const headers = await this.setHeaders(init?.headers);
    const response = await fetch(this.setUrl(input), {
      ...init,
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    return this.handle(response);
  }

  async delete(input: string, init?: RequestInit): Promise<Response> {
    const headers = await this.setHeaders(init?.headers, false);
    const response = await fetch(this.setUrl(input), {
      ...init,
      method: "DELETE",
      headers,
    });
    return this.handle(response);
  }
}
