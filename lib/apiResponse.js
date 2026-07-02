import { NextResponse } from "next/server";
import { apiLogger } from "@/lib/apiLogger";

export function errorResponse(message, status = 400, extra = {}) {
    const resolvedError = typeof extra?.error === "string" ? extra.error : message;

    // Log non-auth errors (auth failures are logged by apiAuth)
    if (status >= 500) {
        apiLogger.error(`[${status}] ${message}`);
    } else if (status >= 400 && status !== 401 && status !== 403) {
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

export function successResponse(payload = {}, status = 200) {
    return NextResponse.json(
        {
            success: true,
            ...payload,
        },
        { status }
    );
}
