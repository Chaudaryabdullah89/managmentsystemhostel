import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the protected routes and their allowed roles
const routePermissions: Record<string, string[]> = {
    '/admin': ['ADMIN', 'SUPER_ADMIN', 'WARDEN'],
    '/staff': ['STAFF', 'WARDEN', 'ADMIN', 'SUPER_ADMIN'],
    '/warden': ['WARDEN', 'ADMIN', 'SUPER_ADMIN'],
    '/guest': ['GUEST', 'RESIDENT', 'ADMIN', 'SUPER_ADMIN', 'WARDEN', 'STAFF'],
    // Add other routes as needed
};

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip static assets, API routes (handled separately or open), and auth pages
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') || // Check for files like favicon.ico
        pathname.startsWith('/auth')
    ) {
        return NextResponse.next();
    }

    // 2. Check for token
    const token = request.cookies.get('token')?.value;

    if (!token) {
        // Redirect to login if accessing a protected route without a token
        if (Object.keys(routePermissions).some(route => pathname.startsWith(route))) {
            const loginUrl = new URL('/auth/login', request.url);
            // Optional: Add redirect param to return after login
            return NextResponse.redirect(loginUrl);
        }
        // Allow public routes if any (e.g. landing page /)
        return NextResponse.next();
    }

    // 3. Verify Token
    let payload;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || ''); // Ensure fallback or proper env
        const { payload: decoded } = await jwtVerify(token, secret);
        payload = decoded;
    } catch (error) {
        console.error('Middleware Token Verification Failed:', error);
        // Invalid token, redirect to login
        // Clear cookie ideally? Middleware response can set cookies.
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('token');
        return response;
    }

    const userRole = payload.role as string;

    console.log(`[Middleware] Path: ${pathname}, Role: ${userRole}`);

    // 4. Role-Based Access Control
    // Check if current path requires permissions
    // Sort keys by length desc to match most specific route first
    const sortedRoutes = Object.keys(routePermissions).sort((a, b) => b.length - a.length);
    const matchedRoute = sortedRoutes.find(route => {
        // Match exact route or sub-route (e.g. /admin matches /admin and /admin/dashboard)
        // But NOT /administrator (if route is /admin)
        if (pathname === route) return true;
        if (pathname.startsWith(`${route}/`)) return true;
        return false;
    });

    if (matchedRoute) {
        console.log(`[Middleware] Matched protected route: ${matchedRoute}`);
        const allowedRoles = routePermissions[matchedRoute];

        if (!allowedRoles.includes(userRole)) {
            console.log(`[Middleware] Access Denied: Role ${userRole} is not in [${allowedRoles}]`);

            // Unauthorized access checks
            if (userRole === 'GUEST' || userRole === 'RESIDENT') {
                if (pathname.startsWith('/admin') || pathname.startsWith('/staff') || pathname.startsWith('/warden')) {
                    return NextResponse.redirect(new URL('/guest/dashboard', request.url));
                }
            }

            if (userRole === 'STAFF') {
                if (pathname.startsWith('/admin') || pathname.startsWith('/warden')) {
                    return NextResponse.redirect(new URL('/staff/dashboard', request.url));
                }
            }

            // Default Deny for any other unauthorized case
            // (e.g. Admin trying to access SuperAdmin only, or undefined role)
            const url = new URL('/auth/login', request.url);
            url.searchParams.set('error', 'Unauthorized');
            return NextResponse.redirect(url);
        }
    }

    // 5. Explicit Redirects logic (e.g. if user is logged in and hits /auth/login, send them to dashboard)
    /* 
    if (pathname.startsWith('/auth')) {
        if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else {
            return NextResponse.redirect(new URL('/guest/dashboard', request.url));
        }
    }
    */
    // Note: I skipped strict auth page redirect for now to avoid loop issues if I mess up, 
    // but usually it's good UX. The prompt focused on *route protection*.

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};