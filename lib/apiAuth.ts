import { NextResponse } from "next/server";
import { checkRole } from "@/lib/checkRole";
import { errorResponse } from "@/lib/apiResponse";
import { apiLogger } from "@/lib/apiLogger";

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
        apiLogger.auth("FAIL", errMsg);
        return {
            ok: false,
            success: false,
            error: errMsg,
            status: errStatus,
            response: errorResponse(errMsg, errStatus),
        };
    }
    apiLogger.auth("PASS", "requireAuth", auth.user?.role);
    return { ok: true, success: true, user: auth.user };
}

export async function requireRoles(roles: string[] = []): Promise<AuthResponse> {
    const auth = await checkRole(roles);
    if (!auth.success) {
        const errMsg = auth.error || "Forbidden";
        const errStatus = auth.status || 403;
        apiLogger.auth("FAIL", `requireRoles([${roles.join(",")}]) — ${errMsg}`);
        return {
            ok: false,
            success: false,
            error: errMsg,
            status: errStatus,
            response: errorResponse(errMsg, errStatus),
        };
    }
    apiLogger.auth("PASS", `requireRoles([${roles.join(",")}])`, auth.user?.role);
    return { ok: true, success: true, user: auth.user };
}

export async function requireSelfOrRoles(resourceUserId: string, roles: string[] = []): Promise<AuthResponse> {
    const auth = await checkRole([]);
    if (!auth.success) {
        const errMsg = auth.error || "Unauthorized";
        const errStatus = auth.status || 401;
        apiLogger.auth("FAIL", errMsg);
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
        apiLogger.auth("FAIL", `requireSelfOrRoles — not self and not in [${roles.join(",")}]`);
        return {
            ok: false,
            success: false,
            error: "Forbidden",
            status: 403,
            response: errorResponse("Forbidden", 403),
        };
    }

    apiLogger.auth("PASS", isSelf ? "self-access" : `role: ${auth.user?.role}`, auth.user?.role);
    return { ok: true, success: true, user: auth.user };
}
