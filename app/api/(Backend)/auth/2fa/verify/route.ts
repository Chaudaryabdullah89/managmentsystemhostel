import { NextRequest, NextResponse } from "next/server";
import * as otplib from "otplib";
// @ts-ignore
const { authenticator } = otplib;
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;
        const body = await request.json();
        const { otp } = body;

        if (!otp || typeof otp !== "string") {
            return errorResponse("A valid 6-digit OTP is required.", 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true }
        });

        if (!user || !user.twoFactorSecret) {
            return errorResponse("2FA setup has not been initiated for this user.", 400);
        }

        if (user.twoFactorEnabled) {
            return errorResponse("2FA is already enabled.", 400);
        }

        // Verify the token
        const isValid = authenticator.verify({
            token: otp,
            secret: user.twoFactorSecret,
        });

        if (!isValid) {
            return errorResponse("Invalid OTP code. Please try again.", 400);
        }

        // Enable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true }
        });

        return successResponse({
            message: "Two-Factor Authentication has been successfully enabled.",
        });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/verify - Error:", error);
        return errorResponse("Failed to verify 2FA token.", 500);
    }
}
