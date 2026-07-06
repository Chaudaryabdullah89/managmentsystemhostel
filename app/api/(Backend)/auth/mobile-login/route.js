export const dynamic = 'force-dynamic';
import AuthService from '@/lib/services/AuthServices/authservices';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { headers } from 'next/headers';

/**
 * POST /api/auth/mobile-login
 * Mobile-specific login endpoint that returns a JWT token.
 * Used by the React Native mobile app (which can't use cookie-based NextAuth sessions).
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        const headerStore = await headers();
        const ipAddress = headerStore.get('x-forwarded-for') || headerStore.get('x-real-ip') || 'Unknown';
        const userAgent = headerStore.get('user-agent') || 'Mobile App';

        const authService = new AuthService();
        const result = await authService.login({ email, password, ipAddress, userAgent });

        if (!result.success) {
            return errorResponse(result.message || 'Login failed', 401);
        }

        // Handle 2FA
        if (result.requires2FA) {
            return successResponse({
                requires2FA: true,
                tempToken: result.tempToken,
                twoFactorMethod: result.twoFactorMethod,
                message: result.message,
            });
        }

        return successResponse({
            token: result.token,
            User: result.User,
            message: result.message,
        });
    } catch (error) {
        console.error('[mobile-login] Error:', error);
        return errorResponse('Internal server error', 500);
    }
}

/**
 * POST /api/auth/mobile-register
 * Mobile registration — creates GUEST account and returns JWT.
 */
export async function PUT(request) {
    try {
        const body = await request.json();
        const { name, email, password, phone } = body;

        if (!name || !email || !password || !phone) {
            return errorResponse('Name, email, password, and phone are required', 400);
        }

        const authService = new AuthService();
        const result = await authService.register({ name, email, password, phone });

        if (!result.success) {
            return errorResponse(result.message || 'Registration failed', 400);
        }

        return successResponse({
            token: result.token,
            User: result.User,
            message: result.message,
        });
    } catch (error) {
        console.error('[mobile-register] Error:', error);
        return errorResponse('Internal server error', 500);
    }
}
