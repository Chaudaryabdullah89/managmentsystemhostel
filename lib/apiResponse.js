import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { apiLogger } from "@/lib/apiLogger";

/**
 * Returns a 4xx/5xx JSON response and automatically logs the error.
 */
export function errorResponse(message, status = 400, extra = {}) {
    const resolvedError = typeof extra?.error === "string" ? extra.error : message;

    // Log all error responses
    if (status >= 500) {
        apiLogger.error(`[${status}] ${message}`);
    } else if (status >= 400 && status !== 401 && status !== 403) {
        apiLogger.warn(`[${status}] ${message}`);
    } else if (status === 401 || status === 403) {
        apiLogger.warn(`[${status}] ${message}`);
    }

    return NextResponse.json(
        {
            success: false,
            message,
            error: resolvedError,
            ...extra,
        },
        { status }
    );
}

/**
 * Returns a 2xx JSON response and logs success with optional duration.
 * The x-request-start header (set by middleware) is used to calculate ms.
 */
export async function successResponse(payload = {}, status = 200) {
    // Attempt to read request-start time set by middleware for duration logging
    try {
        const hdrs = await headers();
        const start = hdrs.get("x-request-start");
        if (start) {
            const durationMs = Date.now() - parseInt(start, 10);
            const dur = durationMs > 500
                ? `\x1b[31m${durationMs}ms\x1b[0m`
                : durationMs > 200
                    ? `\x1b[33m${durationMs}ms\x1b[0m`
                    : `\x1b[90m${durationMs}ms\x1b[0m`;
            const ts = new Date().toTimeString().slice(0, 8);
            console.log(
                `\x1b[90m${ts}\x1b[0m \x1b[32m◀ ${status} OK\x1b[0m ${dur}`
            );
        }
    } catch {
        // headers() only works in Server Components / RSC context — silently skip
    }

    return NextResponse.json(
        {
            success: true,
            ...payload,
        },
        { status }
    );
}

