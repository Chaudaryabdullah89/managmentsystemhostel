import { NextRequest } from "next/server";
import { verifySync as otplibVerify } from "otplib";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

function hashCode(code: string): string {
    return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;
        const body = await request.json();
        const { otp, method } = body;

        if (!otp || typeof otp !== "string") {
            return errorResponse("A valid verification code is required.", 400);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true, email: true }
        });

        if (!user) {
            return errorResponse("User not found.", 404);
        }

        const verifyMethod = method || "TOTP";

        // ── TOTP Verification ─────────────────────────────────────────────
        if (verifyMethod === "TOTP") {
            if (!user.twoFactorSecret) {
                return errorResponse("TOTP setup has not been initiated.", 400);
            }
            if (user.twoFactorEnabled && user.twoFactorSecret) {
                return errorResponse("2FA is already enabled.", 400);
            }

            const result = await otplibVerify({ token: otp, secret: user.twoFactorSecret });
            if (!result.valid) {
                return errorResponse("Invalid code. Please try again.", 400);
            }

            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true, twoFactorMethod: "TOTP" }
            });

            return successResponse({
                message: "Authenticator App 2FA has been enabled.",
                method: "TOTP",
            });
        }

        // ── Email OTP Verification ────────────────────────────────────────
        if (verifyMethod === "EMAIL") {
            const record = await prisma.otpVerification.findUnique({
                where: { id: `2fa-setup-${userId}` }
            });

            if (!record || record.expiresAt < new Date()) {
                return errorResponse("Code expired or not found. Please request a new one.", 400);
            }

            const hashed = hashCode(otp);
            if (hashed !== record.otp) {
                return errorResponse("Invalid code. Please try again.", 400);
            }

            // Clean up and enable
            await prisma.otpVerification.delete({ where: { id: `2fa-setup-${userId}` } });
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true, twoFactorMethod: "EMAIL" }
            });

            return successResponse({
                message: "Email OTP 2FA has been enabled.",
                method: "EMAIL",
            });
        }

        // ── Backup Codes Verification ─────────────────────────────────────
        if (verifyMethod === "BACKUP_CODES") {
            // For setup verification, just enable it (codes were already saved in setup)
            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorEnabled: true, twoFactorMethod: "BACKUP_CODES" }
            });

            return successResponse({
                message: "Backup Codes 2FA has been enabled.",
                method: "BACKUP_CODES",
            });
        }

        return errorResponse("Invalid 2FA method.", 400);

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/verify - Error:", error);
        return errorResponse("Failed to verify 2FA.", 500);
    }
}
