'use client';

/**
 * useAuth.ts — Legacy logout/check helper
 *
 * For user data and permissions: use useAuthStore() from @/hooks/Authstate
 * For permission checks: use usePermissions() from @/hooks/usePermissions
 *
 * This hook is kept for the logout() function which is still used in some places.
 * getUser() now delegates to the Zustand store (no localStorage reads).
 */

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import useAuthStore from '@/hooks/Authstate';

export function useAuth() {
    const router = useRouter();
    const storeUser = useAuthStore((state) => state.user);

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear client state regardless of API result
            Cookies.remove('token');
            // Clear any legacy localStorage keys (may still exist from older code)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            // Reset Zustand store
            useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });

            toast.success('Logged out successfully');
            window.location.href = '/auth/login';
        }
    };

    /**
     * @deprecated Use useAuthStore((s) => s.user) directly instead.
     */
    const getUser = () => storeUser;

    const getToken = () => Cookies.get('token');

    const isAuthenticated = () => !!getToken();

    return {
        logout,
        getUser,
        getToken,
        isAuthenticated,
    };
}
