const { prisma } = require("@/lib/prisma");
const { NextResponse, NextRequest } = require("next/server");
import bcrypt from "bcrypt";
export async function POST(request) {
    const body = await request.json();
    const { email, newpassword, token } = body;
    console.log(`[API] POST /api/reset-password - Request received for email: ${email}`);

    if (!email || !token || !newpassword) {
        console.log(`[API] POST /api/reset-password - Missing required fields`);
        return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })
    if (!user) {
        console.log(`[API] POST /api/reset-password - User not found for email: ${email}`);
        return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const resetPassword = await prisma.resetPassword.findUnique({
        where: {
            token: token,
        },
        select: {
            id: true,
            expiresAt: true,
            email: true,
            userId: true
        },
    })

    if (!resetPassword) {
        console.log(`[API] POST /api/reset-password - Invalid token supplied`);
        return NextResponse.json({ message: "Invalid token" }, { status: 400 })
    }

    const isTokenExpired = resetPassword.expiresAt < new Date();
    if (isTokenExpired) {
        console.log(`[API] POST /api/reset-password - Token expired`);
        return NextResponse.json({ message: "Token expired" }, { status: 400 })
    }

    console.log(`[API] POST /api/reset-password - Hashing new password`);
    const hashedPassword = await bcrypt.hash(newpassword, 10);

    console.log(`[API] POST /api/reset-password - Updating user password`);
    await prisma.user.update({
        where: {
            id: resetPassword.userId
        },
        data: {
            password: hashedPassword
        }
    })

    console.log(`[API] POST /api/reset-password - Deleting used token`);
    await prisma.resetPassword.delete({
        where: {
            token: token
        }
    })

    console.log(`[API] POST /api/reset-password - Password reset successfully`);
    return NextResponse.json({ message: "Password reset successfully" }, { status: 200 })
}