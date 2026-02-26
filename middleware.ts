import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ===============================
// Route Permissions (RBAC)
// ===============================
const routePermissions: Record<string, string[]> = {
    '/admin': ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
    '/staff': ['STAFF', 'WARDEN', 'ADMIN', 'SUPER_ADMIN'],
    '/warden': ['WARDEN', 'ADMIN', 'SUPER_ADMIN'],
    '/guest': ['GUEST', 'RESIDENT', 'ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STAFF'],
};

// ===============================
// Helper: Match Protected Route
// ===============================
function matchProtectedRoute(pathname: string) {
    const routes = Object.keys(routePermissions).sort(
        (a, b) => b.length - a.length // longest first
    );

    return routes.find(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );
}

// ===============================
// Middleware
// ===============================
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1️⃣ Skip public paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/auth') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const matchedRoute = matchProtectedRoute(pathname);

    // If route is not protected → allow
    if (!matchedRoute) {
        return NextResponse.next();
    }

    // 2️⃣ Check Token
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 3️⃣ Verify JWT
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }

    let userRole: string | null = null;

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        if (typeof payload.role === 'string') {
            userRole = payload.role;
        }
    } catch (error) {
        console.error('JWT verification failed:', error);

        const response = NextResponse.redirect(
            new URL('/auth/login', request.url)
        );
        response.cookies.delete('token');
        return response;
    }

    if (!userRole) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 4️⃣ Role Check
    const allowedRoles = routePermissions[matchedRoute];

    if (!allowedRoles.includes(userRole)) {
        // Redirect to correct dashboard instead of random auth page

        const roleDashboardMap: Record<string, string> = {
            ADMIN: '/admin/dashboard',
            SUPER_ADMIN: '/admin/dashboard',
            WARDEN: '/warden/dashboard',
            STAFF: '/staff/dashboard',
            GUEST: '/guest/dashboard',
            RESIDENT: '/guest/dashboard',
        };

        const redirectPath =
            roleDashboardMap[userRole] || '/auth/login';

        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
}

// ===============================
// Matcher
// ===============================
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};