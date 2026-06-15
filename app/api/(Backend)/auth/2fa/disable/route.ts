import { NextRequest } from "next/server";
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

        // Clear all 2FA data
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorMethod: null,
                twoFactorSecret: null,
                backupCodes: [],
            }
        });

        // Remove any passkey credentials
        await prisma.webAuthnCredential.deleteMany({
            where: { userId }
        });

        // Clean up any pending OTP records
        try {
            await prisma.otpVerification.delete({ where: { id: `2fa-setup-${userId}` } });
        } catch {
            // Ignore if not found
        }

        return successResponse({
            message: "All 2-Step Verification methods have been disabled.",
        });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/disable - Error:", error);
        return errorResponse("Failed to disable 2FA.", 500);
    }
}
