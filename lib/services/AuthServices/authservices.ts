import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { generateUID, generateRegNumber, UID_PREFIXES } from "@/lib/uid-generator";
import { verifySync as otplibVerify } from "otplib";
import { createHash } from "crypto";


interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string; // Optional — ignored at service level; always overridden to "GUEST"
}

interface LoginData {
    email: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
}

interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    tempToken?: string;
    requires2FA?: boolean;
    twoFactorMethod?: string;
    User?: {
        id: string;
        name: string;
        email: string;
        role: string;
        lastLogin?: Date | string | null;
        canManageExpenses?: boolean;
        canManageMess?: boolean;
        canManageGeneral?: boolean;
        canManageUtilities?: boolean;
        canManageMaintenance?: boolean;
        canManageSalaries?: boolean;
    };
}

export default class AuthService {
    private readonly JWT_SECRET: Uint8Array;
    private readonly SALT_ROUNDS: number = 10;

    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("FATAL: JWT_SECRET environment variable is not set.");
        }
        this.JWT_SECRET = new TextEncoder().encode(secret);
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const { name, email, password, phone, role } = data;


            const existingUser = await prisma.user.findUnique({
                where: {
                    email: email
                }
            });

            if (existingUser) {
                return {
                    success: false,
                    message: "User with this email already exists"
                };
            }

            const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);


            // Security: always force GUEST regardless of what was passed.
            // Role elevation must go through the admin user-creation flow, never public signup.
            const userRole = "GUEST";

            const userId = randomUUID();
            const uid = generateUID(UID_PREFIXES.USER, userId);
            const regNumber = generateRegNumber();

            const user = await prisma.user.create({
                data: {
                    id: userId,
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    role: userRole as any,
                    uid,
                    regNumber,
                    updatedAt: new Date(),
                },
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
                .sign(this.JWT_SECRET);

            return {
                success: true,
                message: "User registered successfully",
                token,
                User: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    canManageExpenses: user.canManageExpenses,
                    canManageMess: user.canManageMess,
                    canManageGeneral: user.canManageGeneral,
                    canManageUtilities: user.canManageUtilities,
                    canManageMaintenance: user.canManageMaintenance,
                    canManageSalaries: user.canManageSalaries
                }
            };
        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                message: "An error occurred during registration"
            };
        }
    }

    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const { email, password, ipAddress, userAgent } = data;


            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            });

            if (!user) {
                return {
                    success: false,
                    message: "Invalid email or password"
                };
            }


            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: "Invalid email or password"
                };
            }
            if (user.isActive === false) {
                return {
                    success: false,
                    message: "User is not active"
                };
            }

            // --- 2FA Check ---
            if (user.twoFactorEnabled) {
                if (user.twoFactorMethod === "PASSKEY" || user.twoFactorMethod === "passkey") {
                    // Passkey 2FA is deprecated/removed. Turn it off.
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { twoFactorEnabled: false, twoFactorMethod: null }
                    });
                    user.twoFactorEnabled = false;
                    user.twoFactorMethod = null;
                }
            }

            if (user.twoFactorEnabled) {
                const tempToken = await new SignJWT({
                    userId: user.id,
                    is2FAAuth: true,
                })
                .setProtectedHeader({ alg: "HS256" })
                .setIssuedAt()
                .setExpirationTime("5m") // 5 minutes to complete 2FA
                .sign(this.JWT_SECRET);

                return {
                    success: true,
                    requires2FA: true,
                    tempToken,
                    twoFactorMethod: user.twoFactorMethod || "TOTP",
                    message: "2FA verification required"
                };
            }
            // -----------------
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
                .sign(this.JWT_SECRET);


            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.session.create({
                data: {
                    id: randomUUID(),
                    userId: user.id,
                    token,
                    device: userAgent || "Unknown Device",
                    ipAddress: ipAddress || "Unknown IP",
                    expiresAt
                }
            });

            return {
                success: true,
                message: "Login successful",
                token,

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
                    canManageSalaries: user.canManageSalaries
                }

            };
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                message: "An error occurred during login"
            };
        }
    }

    private hashCode(code: string): string {
        return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
    }

    async login2FA(tempToken: string, otp: string, ipAddress: string, userAgent: string, method?: string): Promise<AuthResponse> {
        try {
            const { jwtVerify } = await import("jose");
            const { payload } = await jwtVerify(tempToken, this.JWT_SECRET);
            
            if (!payload.is2FAAuth || !payload.userId) {
                return { success: false, message: "Invalid temporary token" };
            }

            const userId = payload.userId as string;

            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user || !user.twoFactorEnabled) {
                return { success: false, message: "2FA is not configured for this user" };
            }

            const activeMethod = method || user.twoFactorMethod || "TOTP";
            let isValid = false;

            // ── TOTP Verification ─────────────────────────────────────
            if (activeMethod === "TOTP") {
                if (!user.twoFactorSecret) {
                    return { success: false, message: "TOTP not configured" };
                }
                const result = await otplibVerify({ token: otp, secret: user.twoFactorSecret });
                isValid = result.valid;
            }
            // ── Email OTP Verification ────────────────────────────────
            else if (activeMethod === "EMAIL") {
                const record = await prisma.otpVerification.findUnique({
                    where: { id: `2fa-login-${userId}` }
                });
                if (!record || record.expiresAt < new Date()) {
                    return { success: false, message: "Code expired. Please request a new one." };
                }
                isValid = this.hashCode(otp) === record.otp;
                if (isValid) {
                    await prisma.otpVerification.delete({ where: { id: `2fa-login-${userId}` } });
                }
            }
            // ── Backup Code Verification ──────────────────────────────
            else if (activeMethod === "BACKUP_CODES") {
                const hashed = this.hashCode(otp);
                const codeIndex = user.backupCodes.indexOf(hashed);
                if (codeIndex >= 0) {
                    isValid = true;
                    // Remove used code
                    const updatedCodes = [...user.backupCodes];
                    updatedCodes.splice(codeIndex, 1);
                    await prisma.user.update({
                        where: { id: userId },
                        data: { backupCodes: updatedCodes }
                    });
                }
            }

            if (!isValid) {
                return { success: false, message: "Invalid verification code" };
            }

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
            .sign(this.JWT_SECRET);

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.session.create({
                data: {
                    id: randomUUID(),
                    userId: user.id,
                    token,
                    device: userAgent || "Unknown Device",
                    ipAddress: ipAddress || "Unknown IP",
                    expiresAt
                }
            });

            return {
                success: true,
                message: "2FA verification successful",
                token,
                User: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin,
                    canManageExpenses: user.canManageExpenses,
                    canManageMess: user.canManageMess,
                    canManageGeneral: user.canManageGeneral,
                    canManageUtilities: user.canManageUtilities,
                    canManageMaintenance: user.canManageMaintenance,
                    canManageSalaries: user.canManageSalaries
                }
            };
        } catch (error) {
            console.error("2FA Login error:", error);
            return {
                success: false,
                message: "Invalid or expired temporary token"
            };
        }
    }

    // Note: Token verification is handled by `jose` in proxy.ts and checkRole.js.
    // This method is kept for legacy compatibility but should not be used directly.
    async verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
        try {
            const { jwtVerify } = await import("jose");
            const { payload } = await jwtVerify(token, this.JWT_SECRET);
            return payload as { userId: string; email: string };
        } catch (error) {
            console.error("Token verification error:", error);
            return null;
        }
    }
}
