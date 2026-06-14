import { NextResponse } from "next/server";
import { checkRole } from "@/lib/checkRole";
import { errorResponse } from "@/lib/apiResponse";

export interface AuthResponse {
    ok: boolean;
    success: boolean;
    user?: any;
    error?: string;
    status?: number;
    response?: any;
}

/**
 * All helpers return BOTH shapes so routes work regardless of which they check:
 *   - { success, user, error, status }  — used by ~46 existing routes
 *   - { ok, user, response }            — modern pattern
 */

export async function requireAuth(): Promise<AuthResponse> {
    const auth = await checkRole([]);
    if (!auth.success) {
        const errMsg = auth.error || "Unauthorized";
        const errStatus = auth.status || 401;
        return {
            ok: false,
            success: false,
            error: errMsg,
            status: errStatus,
            response: errorResponse(errMsg, errStatus),
        };
    }
    return { ok: true, success: true, user: auth.user };
}

export async function requireRoles(roles: string[] = []): Promise<AuthResponse> {
    const auth = await checkRole(roles);
    if (!auth.success) {
        const errMsg = auth.error || "Forbidden";
        const errStatus = auth.status || 403;
        return {
            ok: false,
            success: false,
            error: errMsg,
            status: errStatus,
            response: errorResponse(errMsg, errStatus),
        };
    }
    return { ok: true, success: true, user: auth.user };
}

export async function requireSelfOrRoles(resourceUserId: string, roles: string[] = []): Promise<AuthResponse> {
    const auth = await checkRole([]);
    if (!auth.success) {
        const errMsg = auth.error || "Unauthorized";
        const errStatus = auth.status || 401;
        return {
            ok: false,
            success: false,
            error: errMsg,
            status: errStatus,
            response: errorResponse(errMsg, errStatus),
        };
    }

    const currentUserId = auth.user?.id || auth.user?.userId || auth.user?.sub;
    const isSelf = currentUserId && resourceUserId && currentUserId === resourceUserId;
    const hasRole = Array.isArray(roles) && roles.includes(auth.user?.role);

    if (!isSelf && !hasRole) {
        return {
            ok: false,
            success: false,
            error: "Forbidden",
            status: 403,
            response: errorResponse("Forbidden", 403),
        };
    }

    return { ok: true, success: true, user: auth.user };
}
