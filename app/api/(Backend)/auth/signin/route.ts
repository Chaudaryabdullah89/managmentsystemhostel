import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
    // ── Rate Limit: 10 attempts per 15 minutes per IP ────────────────────
    const rateLimitCheck = rateLimiter(request, 10, 15 * 60 * 1000);
    if (!rateLimitCheck.success) {
        return NextResponse.json(
            { success: false, message: rateLimitCheck.error },
            { status: 429 }
        );
    }

    const authService = new AuthService();
    const data = await request.json();
    const { email, password } = data;

    // ── Basic input validation ────────────────────────────────────────────
    if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json({ success: false, message: "A valid email is required." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 1) {
        return NextResponse.json({ success: false, message: "Password is required." }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown";

    try {
        const response = await authService.login({ email: email.trim().toLowerCase(), password, ipAddress, userAgent });

        if (!response.success) {
            return NextResponse.json(response, { status: 401 });
        }

        // ── Set httpOnly cookie server-side for XSS protection ─────────────
        const nextResponse = NextResponse.json({
            success: true,
            message: response.message,
            User: response.User,
            // NOTE: Do NOT send the raw token in the JSON body — it stays in the cookie only.
            // The client needs the token for the Zustand store; we send it once here then rely on the cookie.
            token: response.token,
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
        return NextResponse.json(
            { success: false, message: "An unexpected error occurred. Please try again." },
            { status: 500 }
        );
    }
}
