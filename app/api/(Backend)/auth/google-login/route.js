import { SignJWT } from "jose";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { generateUID, generateRegNumber, UID_PREFIXES } from "@/lib/uid-generator";
import { successResponse, errorResponse } from "@/lib/apiResponse";
import bcrypt from "bcrypt";

export async function POST(request) {
    try {
        const { email, name, image } = await request.json();

        if (!email) {
            return errorResponse("Email is required for Google Sign-In", 400);
        }

        // 1. Look up user by email
        let user = await prisma.user.findUnique({
            where: { email },
            include: {
                ResidentProfile: true,
                StaffProfile: true
            }
        });

        // 2. If user doesn't exist, create a new user with role GUEST
        if (!user) {
            const userId = randomUUID();
            const uid = generateUID(UID_PREFIXES.USER, userId);
            const regNumber = generateRegNumber();
            const hashedPassword = await bcrypt.hash(randomUUID(), 10); // Random password for social accounts

            user = await prisma.user.create({
                data: {
                    id: userId,
                    name: name || email.split("@")[0],
                    email: email,
                    password: hashedPassword,
                    role: "GUEST",
                    uid: uid,
                    regNumber: regNumber,
                    image: image || null,
                    updatedAt: new Date()
                },
                include: {
                    ResidentProfile: true,
                    StaffProfile: true
                }
            });
        } else if (image && !user.image) {
            // Update image if user has no avatar set
            user = await prisma.user.update({
                where: { id: user.id },
                data: { image },
                include: {
                    ResidentProfile: true,
                    StaffProfile: true
                }
            });
        }

        // 3. Check if user is active
        if (!user.isActive) {
            return errorResponse("Your account has been deactivated. Please contact administration.", 403);
        }

        // 4. Generate JWT session token (similar to AuthService payload)
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }
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

        // 5. Return authentication payload
        return successResponse({
            token,
            User: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                canManageExpenses: user.canManageExpenses,
                canManageMess: user.canManageMess,
                canManageGeneral: user.canManageGeneral,
                canManageUtilities: user.canManageUtilities,
                canManageMaintenance: user.canManageMaintenance,
                canManageSalaries: user.canManageSalaries
            },
            message: "Successfully signed in with Google"
        });

    } catch (error) {
        console.error("[google-login] Error:", error);
        return errorResponse("Internal server error during Google Authentication", 500);
    }
}
