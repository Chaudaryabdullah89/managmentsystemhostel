import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { jwtVerify } from "jose";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tempToken } = body;

        if (!tempToken) {
            return errorResponse("Temporary token is required.", 400);
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) return errorResponse("Server configuration error.", 500);

        const JWT_SECRET = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(tempToken, JWT_SECRET);

        if (!payload.is2FAAuth || !payload.userId) {
            return errorResponse("Invalid temporary token.", 400);
        }

        const userId = payload.userId as string;
        const credentials = await prisma.webAuthnCredential.findMany({
            where: { userId },
        });

        if (credentials.length === 0) {
            return errorResponse("No passkeys registered for this user.", 400);
        }

        const options = await generateAuthenticationOptions({
            rpID: RP_ID,
            allowCredentials: credentials.map((cred) => ({
                id: cred.credentialId,
                transports: cred.transports as any[],
            })),
            userVerification: "preferred",
        });

        // Store challenge
        await prisma.otpVerification.upsert({
            where: { id: `passkey-auth-${userId}` },
            create: {
                id: `passkey-auth-${userId}`,
                email: userId,
                otp: options.challenge,
                type: "PASSKEY_AUTH",
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
            update: {
                otp: options.challenge,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            },
        });

        return successResponse({ options });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/passkey/auth-options - Error:", error);
        return errorResponse("Failed to generate authentication options.", 500);
    }
}
