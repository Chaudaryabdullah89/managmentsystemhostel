import { NextRequest, NextResponse } from "next/server";
import * as otplib from "otplib";
// @ts-ignore
const { authenticator } = otplib;
import qrcode from "qrcode";
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
        const userEmail = authResult.user.email;

        // Generate a new TOTP secret for the user
        const secret = authenticator.generateSecret();
        
        // Create the otpauth:// URL
        // Format: otpauth://totp/Issuer:AccountName?secret=Secret&issuer=Issuer
        const otpauthUrl = authenticator.keyuri(userEmail, "Hostel Portal", secret);

        // Generate a QR code as a data URI
        const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

        // Save the secret temporarily. We won't enable 2FA until they verify the first code.
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret }
        });

        return successResponse({
            message: "2FA secret generated successfully.",
            qrCodeUrl: qrCodeDataUrl,
            secret: secret, // Send secret in case they can't scan the QR
        });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/setup - Error:", error);
        return errorResponse("Failed to generate 2FA setup.", 500);
    }
}
