import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { SignJWT, jwtVerify } from "jose";
import { randomUUID } from "crypto";

const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tempToken, credential } = body;

        if (!tempToken || !credential) {
            return errorResponse("Temporary token and credential are required.", 400);
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) return errorResponse("Server configuration error.", 500);

        const JWT_SECRET = new TextEncoder().encode(secret);
        const { payload } = await jwtVerify(tempToken, JWT_SECRET);

        if (!payload.is2FAAuth || !payload.userId) {
            return errorResponse("Invalid temporary token.", 400);
        }

        const userId = payload.userId as string;

        // Get stored challenge
        const challengeRecord = await prisma.otpVerification.findUnique({
            where: { id: `passkey-auth-${userId}` }
        });

        if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
            return errorResponse("Authentication session expired.", 400);
        }

        // Find the credential in DB
        const storedCredential = await prisma.webAuthnCredential.findFirst({
            where: { userId, credentialId: credential.id }
        });

        if (!storedCredential) {
            return errorResponse("Unknown passkey.", 400);
        }

        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeRecord.otp,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential: {
                id: storedCredential.credentialId,
                publicKey: Buffer.from(storedCredential.publicKey, "base64url"),
                counter: Number(storedCredential.counter),
                transports: storedCredential.transports as any[],
            },
        });

        if (!verification.verified) {
            return errorResponse("Passkey verification failed.", 400);
        }

        // Update counter
        await prisma.webAuthnCredential.update({
            where: { id: storedCredential.id },
            data: { counter: BigInt(verification.authenticationInfo.newCounter) }
        });

        // Clean up challenge
        await prisma.otpVerification.delete({ where: { id: `passkey-auth-${userId}` } });

        // Issue full session token
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return errorResponse("User not found.", 404);

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

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

        const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
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
            }
        });

        const nextResponse = successResponse({
            message: "Passkey verification successful",
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
        console.error("[API] POST /api/auth/2fa/passkey/auth-verify - Error:", error);
        return errorResponse("Failed to verify passkey.", 500);
    }
}
