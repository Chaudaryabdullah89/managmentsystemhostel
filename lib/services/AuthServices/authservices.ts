import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";


interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string

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
    User?: {
        id: string;
        name: string;
        email: string;
        role: string;
        lastLogin?: Date | string | null;
    };
}

export default class AuthService {
    private readonly JWT_SECRET: string;
    private readonly SALT_ROUNDS: number = 10;

    constructor() {
        this.JWT_SECRET = process.env.JWT_SECRET || "";
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


            const userRole = role || "GUEST";

            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    phone,
                    role: userRole as any,
                    updatedAt: new Date()
                }
            });

            const token = jwt.sign(
                { userId: user.id, email: user.email, name: user.name, role: user.role },
                this.JWT_SECRET,
                { expiresIn: '7d' }
            );

            return {
                success: true,
                message: "User registered successfully",
                token,
                User: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
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



            await prisma.user.update({
                where: { id: user.id },
                data: { lastLogin: new Date() }
            });

            const token = jwt.sign(
                { userId: user.id, email: user.email, name: user.name, role: user.role },
                this.JWT_SECRET,
                { expiresIn: '7d' }
            );


            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await prisma.session.create({
                data: {
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
                    lastLogin: new Date()
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

    verifyToken(token: string): { userId: string; email: string } | null {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; email: string };
            return decoded;
        } catch (error) {
            console.error("Token verification error:", error);
            return null;
        }
    }
}
