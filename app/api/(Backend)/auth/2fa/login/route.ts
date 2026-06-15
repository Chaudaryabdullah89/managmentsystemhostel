import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse, NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rateLimit";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
    // ── Rate Limit: 10 attempts per 15 minutes per IP ────────────────────
    const rateLimitCheck = await rateLimiter(request, 10, 15 * 60 * 1000);
    if (!rateLimitCheck.success) {
        return errorResponse(rateLimitCheck.error, 429);
    }

    const authService = new AuthService();
    
    try {
        const data = await request.json();
        const { tempToken, otp, method } = data;

        if (!tempToken || !otp) {
            return errorResponse("Temporary token and verification code are required.", 400);
        }

        const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
        const userAgent = request.headers.get("user-agent") || "Unknown";

        const response = await authService.login2FA(tempToken, otp, ipAddress, userAgent, method);

        if (!response.success) {
            return errorResponse(response.message || "Unauthorized", 401, response);
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
        console.error(`[API] POST /api/auth/2fa/login - Unexpected error:`, error.message);
        return errorResponse("An unexpected error occurred. Please try again.", 500);
    }
}
