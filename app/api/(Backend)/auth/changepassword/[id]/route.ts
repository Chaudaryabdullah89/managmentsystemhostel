import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

type Body = {
    currentPassword?: string;
    newPassword: string;
    isReset?: boolean;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // ── Authentication required ───────────────────────────────────────────
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    const callerId = auth.user.userId || auth.user.id;
    const callerRole = auth.user.role;

    const body: Body = await req.json();
    const { currentPassword, newPassword, isReset } = body;

    if (!newPassword || newPassword.length < 8) {
        return errorResponse("newPassword must be at least 8 characters.", 400);
    }

    // ── RBAC: Only ADMIN or WARDEN can use isReset flag ──────────────────
    if (isReset && callerRole !== "ADMIN" && callerRole !== "WARDEN") {
        return errorResponse("Forbidden: Only admins or wardens can reset passwords.", 403);
    }

    // ── Users can only change their OWN password (unless admin/warden reset) ──
    if (!isReset && callerId !== id) {
        return errorResponse("Forbidden: You can only change your own password.", 403);
    }

    if (!isReset && !currentPassword) {
        return errorResponse("currentPassword is required.", 400);
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return errorResponse("User not found.", 404);
    }

    if (!isReset) {
        const isPasswordValid = await bcrypt.compare(currentPassword!, user.password);
        if (!isPasswordValid) {
            return errorResponse("Current password is incorrect.", 401);
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });

    // Invalidate all sessions on password change
    await prisma.session.updateMany({
        where: { userId: id },
        data: { isActive: false },
    });

    return successResponse({ message: "Password updated successfully." }, 200);
}