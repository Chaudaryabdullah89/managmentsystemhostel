import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
    const body = await request.json();
    const { email, newpassword, token } = body;

    if (!email || !token || !newpassword) {
        return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    if (typeof newpassword !== "string" || newpassword.length < 8) {
        return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }

    try {
        // Verify the reset token first (don't reveal whether email or token is invalid)
        const resetRecord = await prisma.resetPassword.findUnique({
            where: { token },
            select: { id: true, expiresAt: true, email: true, userId: true },
        });

        if (!resetRecord || resetRecord.email !== email) {
            return NextResponse.json({ message: "Invalid or expired reset link." }, { status: 400 });
        }

        if (resetRecord.expiresAt < new Date()) {
            // Clean up expired token
            await prisma.resetPassword.delete({ where: { token } }).catch(() => {});
            return NextResponse.json({ message: "Reset link has expired. Please request a new one." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newpassword, 12);

        // Update password and delete token atomically
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetRecord.userId },
                data: { password: hashedPassword },
            }),
            prisma.resetPassword.delete({ where: { token } }),
            // Invalidate all existing sessions
            prisma.session.updateMany({
                where: { userId: resetRecord.userId },
                data: { isActive: false },
            }),
        ]);

        return NextResponse.json({ message: "Password reset successfully." }, { status: 200 });
    } catch (error) {
        console.error("[API] POST /api/reset-password - Error:", error);
        return NextResponse.json({ message: "An unexpected error occurred." }, { status: 500 });
    }
}