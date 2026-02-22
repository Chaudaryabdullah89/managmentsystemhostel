
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { email, otp, userId } = await req.json();
        console.log(`[API] POST /api/auth/change-email/verify-otp - Request received for userId: ${userId}`);

        if (!email || !otp || !userId) {
            console.warn(`[API] POST /api/auth/change-email/verify-otp - Missing fields: ${!email ? 'email ' : ''}${!otp ? 'otp ' : ''}${!userId ? 'userId' : ''}`);
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        // Find OTP
        const record = await prisma.otpVerification.findFirst({
            where: {
                email,
                otp,
                // type: "EMAIL_UPDATE",
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!record) {
            console.warn(`[API] POST /api/auth/change-email/verify-otp - Invalid/Expired OTP for email: ${email}`);
            return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
        }

        // Check if email is already taken
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            console.warn(`[API] POST /api/auth/change-email/verify-otp - Email already taken: ${email}`);
            return NextResponse.json({ message: "Email is already in use" }, { status: 400 });
        }

        // Update User Email
        console.log(`[API] POST /api/auth/change-email/verify-otp - Updating email for user ${userId} to ${email}`);
        await prisma.user.update({
            where: { id: userId },
            data: { email }
        });

        // Delete used OTP
        console.log(`[API] POST /api/auth/change-email/verify-otp - Cleaning up OTPs`);
        await prisma.otpVerification.deleteMany({
            where: { email, type: "EMAIL_UPDATE" }
        });

        console.log(`[API] POST /api/auth/change-email/verify-otp - Success`);
        return NextResponse.json({ message: "Email updated successfully" });

    } catch (error) {
        console.error(`[API] POST /api/auth/change-email/verify-otp - Error: ${error}`);
        return NextResponse.json({ message: "Failed to verify OTP" }, { status: 500 });
    }
}
