import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { generateRegistrationOptions } from "@simplewebauthn/server";

const RP_NAME = "Hostel Portal";
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";

/**
 * POST /api/auth/passkey/register-options
 * Generate WebAuthn registration options for a logged-in user.
 * Used when the user adds a passkey as a login method from their profile.
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, webauthnCredentials: true },
        });

        if (!user) return errorResponse("User not found.", 404);

        const existingCredentials = user.webauthnCredentials.map((cred) => ({
            id: cred.credentialId,
            transports: cred.transports as any[],
        }));

        const options = await generateRegistrationOptions({
            rpName: RP_NAME,
            rpID: RP_ID,
            userName: user.email,
            userDisplayName: user.name,
            attestationType: "none",
            excludeCredentials: existingCredentials,
            authenticatorSelection: {
                residentKey: "required",      // required for discoverable/login use
                userVerification: "preferred",
            },
        });

        // Store challenge temporarily
        await prisma.otpVerification.upsert({
            where: { id: `passkey-reg-${userId}` },
            create: {
                id: `passkey-reg-${userId}`,
                email: user.email,
                otp: options.challenge,
                type: "PASSKEY_REGISTER",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
            update: {
                otp: options.challenge,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        return successResponse({ options });
    } catch (error: any) {
        console.error("[API] POST /api/auth/passkey/register-options - Error:", error);
        return errorResponse("Failed to generate passkey options.", 500);
    }
}
