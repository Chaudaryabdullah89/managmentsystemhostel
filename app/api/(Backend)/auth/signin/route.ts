import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rateLimit";

interface LoginData {
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    const authService = new AuthService()
    // const rateLimitCheck = rateLimiter(request, 50, 2 * 60 * 1000); // 5 requests per 2 minutes

    // if (!rateLimitCheck.success) {
    //     return NextResponse.json(
    //         { success: false, message: rateLimitCheck.error },
    //         { status: rateLimitCheck.status }
    //     );
    // }

    const data = await request.json()
    const { email, password } = data
    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "Unknown";
    console.log(`[API] POST /api/auth/signin - Request received from IP: ${ipAddress}`);
    console.log(`[API] POST /api/auth/signin - Attempting login for email: ${email}`);

    try {
        const response = await authService.login({ email, password, ipAddress, userAgent })
        if (!response.success) {
            console.warn(`[API] POST /api/auth/signin - Login failed for email: ${email}`);
            return NextResponse.json(response, { status: 401 });
        }
        console.log(`[API] POST /api/auth/signin - Login successful for email: ${email}`);
        return NextResponse.json(response)
    } catch (error: any) {
        console.error(`[API] POST /api/auth/signin - Login failed for email: ${email}. Error: ${error.message}`);
        throw error; // Or let the global error handler handle it, but here it seems it might crash if not handled unless next.js handles it. Actually the original code didn't try/catch here, it propagated?
        // Wait, original code:
        // const response = await authService.login(...)
        // return NextResponse.json(response)

        // If login throws, it returns 500. Ideally we should return 401/400.
        // I will keep behavior similar but wrapped for logging.
    }

}
