/**
 * ─────────────────────────────────────────────────────────────────
 *  withLogger — Route Handler Wrapper
 *
 *  Wraps any Next.js App Router route handler (GET/POST/PATCH/DELETE)
 *  and logs:
 *   ➜  Incoming request  (method, path, query params)
 *   ✓  Successful response  (status, duration)
 *   ✖  Unhandled errors    (stack in dev)
 *
 *  Usage:
 *    export const GET  = withLogger(yourGetHandler);
 *    export const POST = withLogger(yourPostHandler);
 *
 *  Or inline for dynamic params:
 *    export async function GET(req, ctx) {
 *      return withLogger(yourHandler)(req, ctx);
 *    }
 * ─────────────────────────────────────────────────────────────────
 */

import type { NextRequest } from "next/server";
import { apiLogger } from "@/lib/apiLogger";
import { errorResponse } from "@/lib/apiResponse";

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<Response>;

export function withLogger(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: any) => {
    const method  = req.method ?? "GET";
    const url     = new URL(req.url);
    const path    = url.pathname + (url.search ? url.search : "");
    const start   = Date.now();

    apiLogger.request(method, path);

    try {
      const response = await handler(req, ctx);
      const duration = Date.now() - start;
      apiLogger.response(method, path, response.status, duration);
      return response;
    } catch (err) {
      const duration = Date.now() - start;
      apiLogger.error(`Unhandled exception in ${method} ${path}`, err);
      apiLogger.response(method, path, 500, duration, "UNHANDLED");
      return errorResponse("Internal Server Error", 500);
    }
  };
}
