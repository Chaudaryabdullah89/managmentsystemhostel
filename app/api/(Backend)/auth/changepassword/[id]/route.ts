import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

type Body = {
    currentPassword?: string;
    newPassword: string;
    isReset?: boolean;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // console.log(`[API] POST /api/auth/changepassword/${id} - Request received`);

    const body: Body = await req.json();
    const { currentPassword, newPassword, isReset } = body;
    // console.log(`[API] POST /api/auth/changepassword/${id} - processing payload`);

    if (!newPassword) {
        return NextResponse.json({ error: "newPassword is required" }, { status: 400 });
    }

    // If it's an administrative reset, we don't need the current password
    if (!isReset && !currentPassword) {
        // console.warn(`[API] POST /api/auth/changepassword/${id} - Missing required fields for standard change`);
        return NextResponse.json({ error: "currentPassword is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: id } });
    if (!user) {
        // console.warn(`[API] POST /api/auth/changepassword/${id} - User not found`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!isReset) {
        const isPasswordValid = await bcrypt.compare(currentPassword!, user.password);
        if (!isPasswordValid) {
            // console.warn(`[API] POST /api/auth/changepassword/${id} - Invalid current password`);
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: id }, data: { password: hashedPassword } });
    // console.log(`[API] POST /api/auth/changepassword/${id} - Password updated successfully (Reset: ${!!isReset})`);

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
}