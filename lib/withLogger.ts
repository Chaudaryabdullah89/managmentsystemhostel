/**
 * ─────────────────────────────────────────────────────────────────
 *  withLogger — Route Handler Wrapper + Per-Step Logger
 *
 *  Wraps any Next.js App Router route handler and provides:
 *   ▶  Incoming request log  (method, path, query params)
 *   ◀  Response log          (status code, duration, colour-coded)
 *   ✖  Unhandled error catch (full stack in dev)
 *
 *  The wrapped handler receives a `log` context object with helpers:
 *    log.step("Fetching user…")          → grey step breadcrumb
 *    log.info("Found 5 payments", meta)  → cyan info line
 *    log.warn("Missing field X")         → yellow warning
 *    log.ok("Payment created", meta)     → green success
 *    log.fail("Not found", err)          → red failure
 *
 *  Usage (export level):
 *    export const GET  = withLogger(async (req, ctx, log) => { … });
 *    export const POST = withLogger(async (req, ctx, log) => { … });
 *
 *  Usage (inline for dynamic params):
 *    export async function GET(req, ctx) {
 *      return withLogger(async (req, ctx, log) => {
 *        log.step("Auth check…");
 *        …
 *      })(req, ctx);
 *    }
 * ─────────────────────────────────────────────────────────────────
 */

import type { NextRequest } from "next/server";
import { apiLogger } from "@/lib/apiLogger";
import { errorResponse } from "@/lib/apiResponse";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RouteLog {
  /** Grey breadcrumb — "Fetching user from DB…" */
  step: (msg: string) => void;
  /** Cyan info — optional key/value metadata */
  info: (msg: string, meta?: Record<string, unknown>) => void;
  /** Yellow warning */
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  /** Green success marker */
  ok: (msg: string, meta?: Record<string, unknown>) => void;
  /** Red failure marker (non-throwing) */
  fail: (msg: string, err?: unknown) => void;
}

export type LoggedRouteHandler = (
  req: NextRequest,
  ctx: any,
  log: RouteLog,
) => Promise<Response>;

// ── ANSI palette (inline to avoid circular deps) ─────────────────────────────
const C = {
  reset:   "\x1b[0m",
  dim:     "\x1b[2m",
  bold:    "\x1b[1m",
  gray:    "\x1b[90m",
  cyan:    "\x1b[36m",
  yellow:  "\x1b[33m",
  green:   "\x1b[32m",
  red:     "\x1b[31m",
  magenta: "\x1b[35m",
};

const ts = () => new Date().toTimeString().slice(0, 8);

function makeRouteLog(prefix: string): RouteLog {
  const IS_DEV = process.env.NODE_ENV !== "production";
  const ENABLE_PROD = process.env.ENABLE_API_LOGS === "true";
  if (!IS_DEV && !ENABLE_PROD) {
    // No-op in production unless enabled
    const noop = () => {};
    return { step: noop, info: noop, warn: noop, ok: noop, fail: noop };
  }

  return {
    step: (msg) =>
      console.log(
        `${C.gray}${ts()}${C.reset} ${C.dim}  ↳ ${msg}${C.reset}`
      ),
    info: (msg, meta) =>
      console.log(
        `${C.gray}${ts()}${C.reset} ${C.cyan}  ℹ ${msg}${C.reset}` +
        (meta ? `  ${C.dim}${JSON.stringify(meta)}${C.reset}` : "")
      ),
    warn: (msg, meta) =>
      console.warn(
        `${C.gray}${ts()}${C.reset} ${C.yellow}  ⚠ ${msg}${C.reset}` +
        (meta ? `  ${C.dim}${JSON.stringify(meta)}${C.reset}` : "")
      ),
    ok: (msg, meta) =>
      console.log(
        `${C.gray}${ts()}${C.reset} ${C.green}  ✓ ${msg}${C.reset}` +
        (meta ? `  ${C.dim}${JSON.stringify(meta)}${C.reset}` : "")
      ),
    fail: (msg, err) => {
      const errStr = err instanceof Error ? err.message : err ? String(err) : "";
      console.error(
        `${C.gray}${ts()}${C.reset} ${C.red}  ✖ ${msg}${C.reset}` +
        (errStr ? ` — ${errStr}` : "")
      );
    },
  };
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

export function withLogger(handler: LoggedRouteHandler) {
  return async (req: NextRequest, ctx?: any): Promise<Response> => {
    const method = req.method?.toUpperCase() ?? "GET";
    const url    = new URL(req.url);
    const path   = url.pathname + (url.search || "");
    const start  = Date.now();

    // Request header already logged in middleware; this adds a route-level trace
    const log = makeRouteLog(path);

    try {
      const response = await handler(req, ctx ?? {}, log);
      const durationMs = Date.now() - start;
      apiLogger.response(method, path, response.status, durationMs);
      return response;
    } catch (err) {
      const durationMs = Date.now() - start;
      apiLogger.error(`Unhandled exception in ${method} ${path}`, err);
      apiLogger.response(method, path, 500, durationMs, "UNHANDLED");
      return errorResponse("Internal Server Error", 500);
    }
  };
}

export default withLogger;

