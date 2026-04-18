import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

/**
 * Validates the user's JWT from cookies and checks against allowed roles.
 * Must be used in Server Components or API Routes.
 * 
 * @param {string[]} allowedRoles - Array of allowed roles (e.g. ['ADMIN', 'WARDEN'])
 * @returns {Promise<{success: boolean, user?: any, error?: string, status?: number}>}
 */
export async function checkRole(allowedRoles = []) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return { success: false, error: "Unauthorized", status: 401 };
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');
        const { payload } = await jwtVerify(token, secret);

        if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
            return { success: false, error: "Forbidden", status: 403 };
        }

        return { success: true, user: payload };
    } catch (e) {
        return { success: false, error: "Invalid or expired token", status: 401 };
    }
}
