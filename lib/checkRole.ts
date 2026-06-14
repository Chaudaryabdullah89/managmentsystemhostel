import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export interface CheckRoleResponse {
    success: boolean;
    user?: any;
    error?: string;
    status?: number;
}

/**
 * Validates the user's JWT from cookies and checks against allowed roles.
 * Must be used in Server Components or API Routes.
 *
 * @param {string[]} allowedRoles - Array of allowed roles (e.g. ['ADMIN', 'WARDEN']).
 *                                   Pass [] to only verify the token, not the role.
 * @returns {Promise<CheckRoleResponse>}
 */
export async function checkRole(allowedRoles: string[] = []): Promise<CheckRoleResponse> {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('[checkRole] FATAL: JWT_SECRET environment variable is not set.');
        return { success: false, error: 'Server misconfiguration', status: 500 };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return { success: false, error: 'Unauthorized', status: 401 };
    }

    try {
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(token, secret);

        if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role as string)) {
            return { success: false, error: 'Forbidden', status: 403 };
        }

        return { success: true, user: payload };
    } catch {
        return { success: false, error: 'Invalid or expired token', status: 401 };
    }
}

