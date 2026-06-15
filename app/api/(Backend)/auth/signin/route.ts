import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rateLimit";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
    // ── Rate Limit: 10 attempts per 15 minutes per IP ────────────────────
    const rateLimitCheck = await rateLimiter(request, 10, 15 * 60 * 1000);
    if (!rateLimitCheck.success) {
        return errorResponse(rateLimitCheck.error, 429);
    }

    const authService = new AuthService();
    const data = await request.json();
    const { email, password } = data;

    // ── Basic input validation ────────────────────────────────────────────
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return errorResponse("A valid email is required.", 400);
    }
    if (!password || typeof password !== "string" || password.length < 1) {
        return errorResponse("Password is required.", 400);
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown";

    try {
        const response = await authService.login({ email: email.trim().toLowerCase(), password, ipAddress, userAgent });

        if (!response.success) {
            return errorResponse(response.message || "Unauthorized", 401, response);
        }

        // ── Handle 2FA Flow ──────────────────────────────────────────────────
        if (response.requires2FA) {
            return successResponse({
                message: response.message,
                requires2FA: true,
                tempToken: response.tempToken,
                twoFactorMethod: response.twoFactorMethod || "TOTP",
            });
        }

        // ── Set httpOnly cookie server-side for XSS protection ─────────────
        const nextResponse = successResponse({
            message: response.message,
            User: response.User,
        });

        nextResponse.cookies.set("token", response.token!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
            path: "/",
        });

        return nextResponse;
    } catch (error: any) {
        console.error(`[API] POST /api/auth/signin - Unexpected error:`, error.message);
        return errorResponse("An unexpected error occurred. Please try again.", 500);
    }
}
