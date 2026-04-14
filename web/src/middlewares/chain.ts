import {
  type NextFetchEvent,
  type NextMiddleware,
  type NextRequest,
  NextResponse,
} from "next/server";

export type CustomMiddleware = (
  request: NextRequest,
  event: NextFetchEvent,
  response: NextResponse,
) => NextResponse | Promise<NextResponse>;

export type MiddlewareFactory = (middleware: CustomMiddleware) => CustomMiddleware;

export function chain(factories: MiddlewareFactory[]): NextMiddleware {
  const terminal: CustomMiddleware = (_req, _ev, res) => res;
  const composed = factories.reduceRight(
    (next, factory) => factory(next),
    terminal,
  );
  return (request, event) =>
    composed(request as NextRequest, event, NextResponse.next());
}
