/**
 * ─────────────────────────────────────────────────────────
 *  Server-side API Logger
 *  Structured, colour-coded request/response logs that
 *  appear in the Next.js dev-server terminal.
 *
 *  Usage (auto-wired via apiResponse & apiAuth):
 *    apiLogger.info("message", { key: value })
 *    apiLogger.warn("message")
 *    apiLogger.error("message", error)
 *    apiLogger.request(method, path, userRole?)
 *    apiLogger.response(method, path, status, durationMs)
 * ─────────────────────────────────────────────────────────
 */

const IS_DEV = process.env.NODE_ENV !== "production";
const ENABLE_PROD_LOGS = process.env.ENABLE_API_LOGS === "true";
const SHOULD_LOG = IS_DEV || ENABLE_PROD_LOGS;

// ANSI color helpers (only applied in dev TTY)
const c = {
  reset:   "\x1b[0m",
  dim:     "\x1b[2m",
  bold:    "\x1b[1m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  cyan:    "\x1b[36m",
  magenta: "\x1b[35m",
  blue:    "\x1b[34m",
  gray:    "\x1b[90m",
  white:   "\x1b[37m",
};

const METHOD_COLORS: Record<string, string> = {
  GET:    c.cyan,
  POST:   c.green,
  PATCH:  c.yellow,
  PUT:    c.yellow,
  DELETE: c.red,
};

const STATUS_COLOR = (s: number) =>
  s >= 500 ? c.red : s >= 400 ? c.yellow : s >= 300 ? c.cyan : c.green;

const ts = () => new Date().toTimeString().slice(0, 8); // HH:MM:SS

function pad(str: string, len: number) {
  return str.padEnd(len, " ").slice(0, len);
}

// ── Core log functions ─────────────────────────────────────────────

export const apiLogger = {

  /**
   * Log an incoming HTTP request
   */
  request(method: string, path: string, role?: string | null) {
    if (!SHOULD_LOG) return;
    const mc = METHOD_COLORS[method.toUpperCase()] || c.white;
    const roleTag = role ? ` ${c.magenta}[${role}]${c.reset}` : "";
    console.log(
      `${c.gray}${ts()}${c.reset} ` +
      `${c.bold}${mc}${pad(method.toUpperCase(), 6)}${c.reset} ` +
      `${c.white}${path}${c.reset}` +
      roleTag
    );
  },

  /**
   * Log a completed HTTP response with status + duration
   */
  response(method: string, path: string, status: number, durationMs: number, extra?: string) {
    if (!SHOULD_LOG) return;
    const mc  = METHOD_COLORS[method.toUpperCase()] || c.white;
    const sc  = STATUS_COLOR(status);
    const dur = durationMs > 500
      ? `${c.red}${durationMs}ms${c.reset}`
      : durationMs > 200
        ? `${c.yellow}${durationMs}ms${c.reset}`
        : `${c.gray}${durationMs}ms${c.reset}`;
    const extraTag = extra ? ` ${c.dim}${extra}${c.reset}` : "";
    console.log(
      `${c.gray}${ts()}${c.reset} ` +
      `${c.dim}${mc}${pad(method.toUpperCase(), 6)}${c.reset} ` +
      `${sc}${status}${c.reset} ` +
      `${c.gray}${path}${c.reset} ` +
      `${dur}${extraTag}`
    );
  },

  /** Generic info */
  info(msg: string, meta?: Record<string, unknown>) {
    if (!SHOULD_LOG) return;
    const metaStr = meta ? ` ${c.dim}${JSON.stringify(meta)}${c.reset}` : "";
    console.log(`${c.gray}${ts()}${c.reset} ${c.cyan}ℹ ${msg}${c.reset}${metaStr}`);
  },

  /** Non-fatal warning */
  warn(msg: string, meta?: Record<string, unknown>) {
    if (!SHOULD_LOG) return;
    const metaStr = meta ? ` ${c.dim}${JSON.stringify(meta)}${c.reset}` : "";
    console.warn(`${c.gray}${ts()}${c.reset} ${c.yellow}⚠  ${msg}${c.reset}${metaStr}`);
  },

  /** Error with optional caught error object */
  error(msg: string, err?: unknown, meta?: Record<string, unknown>) {
    // Always log errors
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
    const errStr  = err instanceof Error ? ` → ${err.message}` : err ? ` → ${String(err)}` : "";
    console.error(`${c.gray}${ts()}${c.reset} ${c.red}✖  ${msg}${errStr}${c.reset}${metaStr}`);
    if (err instanceof Error && err.stack && IS_DEV) {
      console.error(c.dim + err.stack + c.reset);
    }
  },

  /** Auth-specific guard log */
  auth(outcome: "PASS" | "FAIL", reason: string, role?: string) {
    if (!SHOULD_LOG) return;
    if (outcome === "PASS") {
      console.log(`${c.gray}${ts()}${c.reset} ${c.green}🔐 AUTH PASS${c.reset} ${c.dim}${role || "?"} — ${reason}${c.reset}`);
    } else {
      console.log(`${c.gray}${ts()}${c.reset} ${c.red}🔒 AUTH FAIL${c.reset} ${c.dim}${reason}${c.reset}`);
    }
  },
};

export default apiLogger;
