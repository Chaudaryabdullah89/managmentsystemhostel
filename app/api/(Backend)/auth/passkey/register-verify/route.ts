import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

/**
 * POST /api/auth/passkey/register-verify
 * Verify WebAuthn registration and store the credential as a login key.
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;
        const body = await request.json();
        const { credential, deviceName } = body;

        if (!credential) return errorResponse("Credential response is required.", 400);

        // Retrieve stored challenge
        const challengeRecord = await prisma.otpVerification.findUnique({
            where: { id: `passkey-reg-${userId}` },
        });

        if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
            return errorResponse("Registration session expired. Please try again.", 400);
        }

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challengeRecord.otp,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
        });

        if (!verification.verified || !verification.registrationInfo) {
            return errorResponse("Passkey verification failed.", 400);
        }

        const { credential: regCredential, credentialDeviceType, credentialBackedUp } =
            verification.registrationInfo;

        // Derive a friendly device name if none provided
        const resolvedName =
            deviceName ||
            `${credentialDeviceType}${credentialBackedUp ? " (synced)" : ""}`;

        await prisma.webAuthnCredential.create({
            data: {
                userId,
                credentialId: typeof regCredential.id === "string" ? regCredential.id : Buffer.from(regCredential.id as any).toString("base64url"),
                publicKey: Buffer.from(regCredential.publicKey).toString("base64url"),
                counter: BigInt(regCredential.counter),
                deviceName: resolvedName,
                transports: credential.response?.transports || [],
            },
        });

        // Clean up challenge
        await prisma.otpVerification.delete({
            where: { id: `passkey-reg-${userId}` },
        }).catch(() => {});

        return successResponse({ message: "Passkey registered successfully." });
    } catch (error: any) {
        console.error("[API] POST /api/auth/passkey/register-verify - Error:", error);
        return errorResponse("Failed to verify passkey registration.", 500);
    }
}
