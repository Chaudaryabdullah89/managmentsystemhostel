import { NextResponse } from "next/server";
import { checkRole } from "@/lib/checkRole";
import { errorResponse } from "@/lib/apiResponse";

export async function requireAuth() {
    const auth = await checkRole([]);
    if (!auth.success) {
        return {
            ok: false,
            response: errorResponse(auth.error || "Unauthorized", auth.status || 401)
        };
    }
    return { ok: true, user: auth.user };
}

export async function requireRoles(roles = []) {
    const auth = await checkRole(roles);
    if (!auth.success) {
        return {
            ok: false,
            response: errorResponse(auth.error || "Forbidden", auth.status || 403)
        };
    }
    return { ok: true, user: auth.user };
}

export async function requireSelfOrRoles(resourceUserId, roles = []) {
    const auth = await checkRole([]);
    if (!auth.success) {
        return {
            ok: false,
            response: errorResponse(auth.error || "Unauthorized", auth.status || 401)
        };
    }

    const currentUserId = auth.user?.id || auth.user?.userId || auth.user?.sub;
    const isSelf = currentUserId && resourceUserId && currentUserId === resourceUserId;
    const hasRole = Array.isArray(roles) && roles.includes(auth.user?.role);

    if (!isSelf && !hasRole) {
        return {
            ok: false,
            response: errorResponse("Forbidden", 403)
        };
    }

    return { ok: true, user: auth.user };
}
