import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

/**
 * POST /api/auth/passkey/login-verify
 * Passwordless passkey login — Step 2.
 * Verifies the WebAuthn assertion, looks up the user by credential ID,
 * and issues a full session token — no password required.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { credential, challengeKey } = body;

        if (!credential || !challengeKey) {
            return errorResponse("Credential and challengeKey are required.", 400);
        }

        // 1. Fetch stored challenge
        const challengeRecord = await prisma.otpVerification.findUnique({
            where: { id: challengeKey },
        });

        if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
            return errorResponse("Passkey session expired. Please try again.", 400);
        }

        const getRawCredentialId = (storedId: string): string => {
            try {
                const decoded = Buffer.from(storedId, "base64url").toString("utf-8");
                if (/^[A-Za-z0-9_-]+$/.test(decoded) && decoded.length > 10) {
                    return decoded;
                }
            } catch {}
            return storedId;
        };

        // 2. Find the credential by ID (credential.id is base64url)
        // Match either raw base64url or double-encoded base64url
        const doubleEncodedId = Buffer.from(credential.id).toString("base64url");
        const storedCredential = await prisma.webAuthnCredential.findFirst({
            where: {
                credentialId: {
                    in: [credential.id, doubleEncodedId]
                }
            },
        });

        if (!storedCredential) {
            return errorResponse("Passkey not recognised. Please sign in with your password.", 404);
        }

        const rawCredentialId = getRawCredentialId(storedCredential.credentialId);

        // 3. Verify the WebAuthn response
        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeRecord.otp,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: rawCredentialId,
                publicKey: Buffer.from(storedCredential.publicKey, "base64url"),
                counter: Number(storedCredential.counter),
                transports: storedCredential.transports as any[],
            },
        });

        if (!verification.verified) {
            return errorResponse("Passkey verification failed.", 401);
        }

        // 4. Update counter + clean up challenge
        await prisma.webAuthnCredential.update({
            where: { id: storedCredential.id },
            data: { counter: BigInt(verification.authenticationInfo.newCounter) },
        });

        await prisma.otpVerification.delete({ where: { id: challengeKey } }).catch(() => {});

        // 5. Load user and issue JWT session
        const user = await prisma.user.findUnique({
            where: { id: storedCredential.userId },
        });

        if (!user || !user.isActive) {
            return errorResponse("Account not found or deactivated.", 403);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const secret = process.env.JWT_SECRET;
        if (!secret) return errorResponse("Server configuration error.", 500);
        const JWT_SECRET = new TextEncoder().encode(secret);

        const token = await new SignJWT({
            id: user.id,
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            hostelId: user.hostelId,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("7d")
            .sign(JWT_SECRET);

        const ipAddress =
            request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
        const userAgent = request.headers.get("user-agent") || "Unknown";
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.session.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                token,
                device: userAgent,
                ipAddress,
                expiresAt,
            },
        });

        const nextResponse = successResponse({
            message: "Signed in with passkey",
            User: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                lastLogin: new Date(),
                canManageExpenses: user.canManageExpenses,
                canManageMess: user.canManageMess,
                canManageGeneral: user.canManageGeneral,
                canManageUtilities: user.canManageUtilities,
                canManageMaintenance: user.canManageMaintenance,
                canManageSalaries: user.canManageSalaries,
            },
        });

        nextResponse.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return nextResponse;
    } catch (error: any) {
        console.error("[API] POST /api/auth/passkey/login-verify - Error:", error);
        return errorResponse("Passkey authentication failed.", 500);
    }
}
