import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { sendEmail } from "@/lib/utils/sendmail";
import { jwtVerify } from "jose";

function hashCode(code: string): string {
    return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tempToken } = body;

        if (!tempToken) {
            return errorResponse("Temporary token is required.", 400);
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return errorResponse("Server configuration error.", 500);
        }

        const JWT_SECRET = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(tempToken, JWT_SECRET);

        if (!payload.is2FAAuth || !payload.userId) {
            return errorResponse("Invalid temporary token.", 400);
        }

        const userId = payload.userId as string;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, twoFactorMethod: true, twoFactorEnabled: true }
        });

        if (!user || !user.twoFactorEnabled || user.twoFactorMethod !== "EMAIL") {
            return errorResponse("Email 2FA is not configured for this user.", 400);
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await prisma.otpVerification.upsert({
            where: { id: `2fa-login-${userId}` },
            create: {
                id: `2fa-login-${userId}`,
                email: user.email,
                otp: hashCode(code),
                type: "2FA_LOGIN",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
            },
            update: {
                otp: hashCode(code),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        await sendEmail({
            to: user.email,
            subject: "Hostel Portal — Login Verification Code",
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
                    <h2 style="color: #1a1a1a; margin-bottom: 8px;">Login Verification</h2>
                    <p style="color: #666; font-size: 14px;">Use this code to complete your sign in:</p>
                    <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
                    </div>
                    <p style="color: #999; font-size: 12px;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
                </div>
            `,
        });

        return successResponse({
            message: "Verification code sent to your email.",
            email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
        });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/send-email-otp - Error:", error);
        return errorResponse("Failed to send verification code.", 500);
    }
}
