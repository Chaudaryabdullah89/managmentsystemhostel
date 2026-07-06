import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get("token");

        if (!token) {
            return new Response("Missing login token", { status: 400 });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not configured on the server.");
        }

        // 1. Verify the mobile JWT token
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);

        const role = typeof payload.role === "string" ? payload.role.toUpperCase() : null;
        if (!role) {
            return new Response("Invalid token payload", { status: 400 });
        }

        // 2. Map role to respective dashboard URL
        const roleDashboardMap: Record<string, string> = {
            ADMIN: "/admin/dashboard",
            WARDEN: "/warden",
            STAFF: "/staff/dashboard",
            GUEST: "/guest/dashboard",
            RESIDENT: "/guest/dashboard",
        };

        const targetDashboard = roleDashboardMap[role] || "/";

        // 3. Create redirect response and set the http-only token cookie
        const redirectUrl = new URL(targetDashboard, request.url);
        const response = NextResponse.redirect(redirectUrl);

        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days (matching standard session)
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });

        return response;

    } catch (error) {
        console.error("[AutoLogin API] Error:", error);
        return new Response("Auto-login token is invalid or expired. Please sign in normally.", { status: 401 });
    }
}
