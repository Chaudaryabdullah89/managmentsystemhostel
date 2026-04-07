import { NextResponse } from "next/server";

export function errorResponse(message, status = 400, extra = {}) {
    const resolvedError = typeof extra?.error === "string" ? extra.error : message;
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
