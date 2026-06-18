import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ===============================
// Route Permissions (RBAC)
// ===============================
const routePermissions: Record<string, string[]> = {
    '/admin': ['ADMIN'],
    '/staff': ['STAFF', 'WARDEN', 'ADMIN'],
    '/warden': ['WARDEN', 'ADMIN'],
    '/guest': ['GUEST', 'RESIDENT', 'ADMIN', 'WARDEN', 'STAFF'],
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
// Middleware (Next.js requires this exact export name)
// ===============================
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Pass the current pathname to server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);

    // 1️⃣ Skip public paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/auth') ||
        pathname.includes('.')
    ) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    const matchedRoute = matchProtectedRoute(pathname);

    // If route is not protected → allow
    if (!matchedRoute) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
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
            new URL('/auth/login?reason=expired', request.url)
        );
        response.cookies.set({
            name: 'token',
            value: '',
            maxAge: 0,
            path: '/',
            expires: new Date(0),
            sameSite: 'strict',
            secure: process.env.NODE_ENV === "production"
        });
        return response;
    }

    if (!userRole) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 4️⃣ Role Check
    const allowedRoles = routePermissions[matchedRoute];

    if (!allowedRoles.includes(userRole)) {
        // Redirect to correct dashboard instead of a generic auth page
        const roleDashboardMap: Record<string, string> = {
            ADMIN: '/admin/dashboard',
            WARDEN: '/warden',
            STAFF: '/staff/dashboard',
            GUEST: '/guest/dashboard',
            RESIDENT: '/guest/dashboard',
        };

        const redirectPath =
            roleDashboardMap[userRole] || '/auth/login';

        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// ===============================
// Matcher
// ===============================
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
