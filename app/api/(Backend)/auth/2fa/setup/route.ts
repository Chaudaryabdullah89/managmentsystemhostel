import { NextRequest } from "next/server";
import { generateSecret, generateURI } from "otplib";
import qrcode from "qrcode";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { randomBytes, createHash } from "crypto";
import { sendEmail } from "@/lib/utils/sendmail";

function generateBackupCodes(count = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
        const code = randomBytes(4).toString("hex").toUpperCase(); // 8-char hex codes
        codes.push(code);
    }
    return codes;
}

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
        const userEmail = authResult.user.email;
        const body = await request.json();
        const { method } = body; // "TOTP" | "EMAIL" | "BACKUP_CODES"

        // ── TOTP (Authenticator App) ──────────────────────────────────────
        if (method === "TOTP" || !method) {
            const secret = generateSecret();
            const otpauthUrl = generateURI({ strategy: "totp", secret, label: userEmail, issuer: "Hostel Portal" });
            const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

            await prisma.user.update({
                where: { id: userId },
                data: { twoFactorSecret: secret }
            });

            return successResponse({
                message: "Authenticator app setup ready. Scan the QR code.",
                method: "TOTP",
                qrCodeUrl: qrCodeDataUrl,
                secret: secret,
            });
        }

        // ── Email OTP ─────────────────────────────────────────────────────
        if (method === "EMAIL") {
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Store in OtpVerification table (reuse existing model)
            const id = randomBytes(16).toString("hex");
            await prisma.otpVerification.upsert({
                where: { id: `2fa-setup-${userId}` },
                create: {
                    id: `2fa-setup-${userId}`,
                    email: userEmail,
                    otp: hashCode(code),
                    type: "2FA_SETUP",
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
                },
                update: {
                    otp: hashCode(code),
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                },
            });

            await sendEmail({
                to: userEmail,
                subject: "Hostel Portal — 2FA Setup Verification Code",
                html: `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
                        <h2 style="color: #1a1a1a; margin-bottom: 8px;">2-Step Verification Setup</h2>
                        <p style="color: #666; font-size: 14px;">Use this code to complete your Email OTP setup:</p>
                        <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                            <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
                        </div>
                        <p style="color: #999; font-size: 12px;">This code expires in 10 minutes.</p>
                    </div>
                `,
            });

            return successResponse({
                message: "Verification code sent to your email.",
                method: "EMAIL",
                email: userEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email
            });
        }

        // ── Backup Codes ──────────────────────────────────────────────────
        if (method === "BACKUP_CODES") {
            const plainCodes = generateBackupCodes(8);
            const hashedCodes = plainCodes.map(hashCode);

            await prisma.user.update({
                where: { id: userId },
                data: { backupCodes: hashedCodes }
            });

            return successResponse({
                message: "Backup codes generated. Save them securely — you will not see them again.",
                method: "BACKUP_CODES",
                codes: plainCodes,
            });
        }

        return errorResponse("Invalid 2FA method. Use TOTP, EMAIL, or BACKUP_CODES.", 400);

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/setup - Error:", error);
        return errorResponse("Failed to generate 2FA setup.", 500);
    }
}
