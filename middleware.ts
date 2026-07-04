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

    // Detect and handle maintenance mode bypass URL query parameters
    const bypassParam = request.nextUrl.searchParams.get('bypassMaintenance');
    if (bypassParam) {
        try {
            const verifyUrl = new URL(`/api/settings/maintenance-verify?token=${bypassParam}`, request.url);
            const res = await fetch(verifyUrl.toString());
            const data = await res.json();
            // successResponse() spreads payload flat: { success, valid, role }  (no nested .data)
            if (res.ok && data.success && data.valid) {
                // Token is valid! Set dynamic bypass cookie and redirect to clean pathname
                const response = NextResponse.redirect(new URL(request.nextUrl.pathname, request.url));
                response.cookies.set({
                    name: 'bypass_maintenance',
                    value: bypassParam,
                    maxAge: 24 * 60 * 60, // 24 hours
                    path: '/',
                    sameSite: 'strict',
                    secure: process.env.NODE_ENV === "production"
                });
                return response;
            }
        } catch (e) {
            console.error("[Middleware] Maintenance bypass verification error:", e);
        }
    }


    // ── Check existing bypass_maintenance cookie ───────────────────────────────
    // Skip this check for API and static routes to avoid recursive fetch loops.
    const bypassCookie = request.cookies.get('bypass_maintenance')?.value;
    if (bypassCookie && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
        try {
            const verifyUrl = new URL(`/api/settings/maintenance-verify?token=${bypassCookie}`, request.url);
            const res = await fetch(verifyUrl.toString());
            const data = await res.json();
            // successResponse() spreads payload flat: { success, valid, role }  (no nested .data)
            if (res.ok && data.success && data.valid) {
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set("x-pathname", pathname);
                requestHeaders.set("x-request-start", Date.now().toString());
                requestHeaders.set("x-bypass-role", data.role); // "WARDEN" or "GUEST"
                console.log(`[Middleware] bypass GRANTED for ${pathname} → role=${data.role}`);
                return NextResponse.next({ request: { headers: requestHeaders } });
            } else {
                console.log(`[Middleware] bypass DENIED for ${pathname}`, JSON.stringify(data));
            }
        } catch (e) {
            console.error("[Middleware] Bypass cookie verification error:", e);
        }
    }




    // Pass the current pathname to server components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-request-start", Date.now().toString());

    // ── API Route Logging ──────────────────────────────────────────
    // Matcher now INCLUDES /api routes so this fires on every API call.
    if (pathname.startsWith('/api')) {
        const isDev = process.env.NODE_ENV !== 'production';
        const ENABLE_PROD_LOGS = process.env.ENABLE_API_LOGS === 'true';
        if (isDev || ENABLE_PROD_LOGS) {
            const mc: Record<string, string> = {
                GET: '\x1b[36m', POST: '\x1b[32m', PATCH: '\x1b[33m',
                PUT: '\x1b[33m', DELETE: '\x1b[31m',
            };
            const method = request.method.toUpperCase();
            const color = mc[method] || '\x1b[37m';
            const ts = new Date().toTimeString().slice(0, 8);
            const url = new URL(request.url);
            const qs = url.search || '';
            console.log(
                `\x1b[90m${ts}\x1b[0m \x1b[1m${color}▶ ${method.padEnd(6)}\x1b[0m \x1b[37m${pathname}${qs}\x1b[0m`
            );
        }
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const matchedRoute = matchProtectedRoute(pathname);

    // If route is not protected → allow (but check if user is on /auth while already logged in)
    if (!matchedRoute) {
        // ── Auth-page redirect for already-logged-in users ─────────────────
        if (pathname.startsWith('/auth')) {
            const token = request.cookies.get('token')?.value;
            if (token && process.env.JWT_SECRET) {
                try {
                    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                    const { payload } = await jwtVerify(token, secret);
                    const role = typeof payload.role === 'string' ? payload.role.toUpperCase() : null;
                    if (role) {
                        const roleDashboardMap: Record<string, string> = {
                            ADMIN: '/admin/dashboard',
                            WARDEN: '/warden',
                            STAFF: '/staff/dashboard',
                            GUEST: '/guest/dashboard',
                            RESIDENT: '/guest/dashboard',
                        };
                        const dest = roleDashboardMap[role] || '/';
                        return NextResponse.redirect(new URL(dest, request.url));
                    }
                } catch {
                    // Token invalid/expired — let them through to the auth page normally
                }
            }
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // 2️⃣ Check Token
    const token = request.cookies.get('token')?.value;

    if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('reason', 'no-session');
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
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
        // Redirect to correct dashboard via the /redirecting trampoline
        const roleDashboardMap: Record<string, string> = {
            ADMIN: '/admin/dashboard',
            WARDEN: '/warden',
            STAFF: '/staff/dashboard',
            GUEST: '/guest/dashboard',
            RESIDENT: '/guest/dashboard',
        };

        const dashboardPath = roleDashboardMap[userRole] || '/auth/login';

        const trampoline = new URL('/redirecting', request.url);
        trampoline.searchParams.set('to', dashboardPath);
        trampoline.searchParams.set('reason', 'access-denied');
        trampoline.searchParams.set('from', pathname);

        return NextResponse.redirect(trampoline);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

// ===============================
// Matcher — NOW INCLUDES /api routes
// ===============================
export const config = {
    matcher: [
        /*
         * Match EVERY path except Next.js internals and static assets.
         * This includes /api/** routes so API logging works correctly.
         * Previously the matcher excluded /api which broke API logging.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)$).*)',
    ],
};
