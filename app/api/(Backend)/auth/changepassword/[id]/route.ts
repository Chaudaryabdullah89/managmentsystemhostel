import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

type Body = {
    currentPassword?: string;
    newPassword: string;
    isReset?: boolean;
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // ── Authentication required ───────────────────────────────────────────
    const auth = await checkRole([]);
    if (!auth.success) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const callerId = auth.user.userId || auth.user.id;
    const callerRole = auth.user.role;

    const body: Body = await req.json();
    const { currentPassword, newPassword, isReset } = body;

    if (!newPassword || newPassword.length < 8) {
        return NextResponse.json({ error: "newPassword must be at least 8 characters." }, { status: 400 });
    }

    // ── RBAC: Only ADMIN or WARDEN can use isReset flag ──────────────────
    if (isReset && callerRole !== "ADMIN" && callerRole !== "WARDEN") {
        return NextResponse.json({ error: "Forbidden: Only admins or wardens can reset passwords." }, { status: 403 });
    }

    // ── Users can only change their OWN password (unless admin/warden reset) ──
    if (!isReset && callerId !== id) {
        return NextResponse.json({ error: "Forbidden: You can only change your own password." }, { status: 403 });
    }

    if (!isReset && !currentPassword) {
        return NextResponse.json({ error: "currentPassword is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
        return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!isReset) {
        const isPasswordValid = await bcrypt.compare(currentPassword!, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashedPassword } });

    // Invalidate all sessions on password change
    await prisma.session.updateMany({
        where: { userId: id },
        data: { isActive: false },
    });

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
}