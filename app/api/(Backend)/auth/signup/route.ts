import AuthService from "@/lib/services/AuthServices/authservices";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { rateLimiter } from "@/lib/rateLimit";

interface RegisterData {
    name: string;
    email: string;
    password: string;
    phone: string;
    // NOTE: `role` is intentionally excluded — it is hardcoded server-side to "GUEST".
    // Never accept role from client on public signup.
}

export async function POST(request: NextRequest) {
    const authService = new AuthService();
    const rateLimitCheck = await rateLimiter(request, 3, 5 * 60 * 1000); // 3 registrations per 5 minutes

    if (!rateLimitCheck.success) {
        return NextResponse.json(
            { success: false, message: rateLimitCheck.error },
            { status: rateLimitCheck.status }
        );
    }

    const body = await request.json() as RegisterData;
    const { name, email, password, phone } = body;
    // Security: role is ALWAYS forced to "GUEST" on public signup — never trust the client.
    console.log(`[API] POST /api/auth/signup - Attempting registration for email: ${email}`);
    try {
        const response = await authService.register({ name, email, password, phone, role: 'GUEST' });
        console.log(`[API] POST /api/auth/signup - Registration successful for email: ${email}`);
        return NextResponse.json(response);
    } catch (error: any) {
        console.error(`[API] POST /api/auth/signup - Registration failed for email: ${email}. Error: ${error.message}`);
        throw error;
    }
}
