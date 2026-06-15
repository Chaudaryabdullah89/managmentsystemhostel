import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";

function getRawCredentialId(storedId: string): string {
    try {
        const decoded = Buffer.from(storedId, "base64url").toString("utf-8");
        if (/^[A-Za-z0-9_-]+$/.test(decoded) && decoded.length > 10) {
            return decoded;
        }
    } catch {}
    return storedId;
}

/**
 * POST /api/auth/passkey/login-options
 * Passwordless passkey login — Step 1.
 * Accepts an optional email to narrow allowed credentials.
 * If no email, returns a discoverable (usernameless) challenge.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const { email } = body;

        let allowCredentials: { id: string; transports?: any[] }[] = [];
        let challengeKey = "passkey-login-anonymous";

        if (email) {
            const user = await prisma.user.findUnique({
                where: { email },
                include: { webauthnCredentials: true },
            });

            if (user && user.webauthnCredentials.length > 0) {
                allowCredentials = user.webauthnCredentials.map((cred) => ({
                    id: getRawCredentialId(cred.credentialId),
                    transports: cred.transports as any[],
                }));
                challengeKey = `passkey-login-${user.id}`;
            }
            // If user not found or no passkeys, return empty allowCredentials (discoverable mode)
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials,          // empty = discoverable / resident-key
            userVerification: "preferred",
        });

        // Store challenge (keyed to email or anonymous)
        await prisma.otpVerification.upsert({
            where: { id: challengeKey },
            create: {
                id: challengeKey,
                email: email || "anonymous",
                otp: options.challenge,
                type: "PASSKEY_AUTH",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
            update: {
                otp: options.challenge,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        return successResponse({ options, challengeKey });
    } catch (error: any) {
        console.error("[API] POST /api/auth/passkey/login-options - Error:", error);
        return errorResponse("Failed to generate passkey options.", 500);
    }
}
