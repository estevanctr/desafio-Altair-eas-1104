export type HttpAdapter = {
  get: (input: string, init?: RequestInit) => Promise<Response>;
  post: (
    input: string,
    body: Record<string, unknown>,
    init?: RequestInit,
  ) => Promise<Response>;
  put: (
    input: string,
    body: Record<string, unknown>,
    init?: RequestInit,
  ) => Promise<Response>;
  delete: (input: string, init?: RequestInit) => Promise<Response>;
};
