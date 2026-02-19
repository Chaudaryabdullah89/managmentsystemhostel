'use client';

import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

export function useAuth() {
    const router = useRouter();

    const logout = async () => {
        try {

            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
            });


            Cookies.remove('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();

            toast.success('Logged out successfully');

            router.push('/auth/login');

            setTimeout(() => {
                window.location.href = '/auth/login';
            }, 100);
        } catch (error) {
            console.error('Logout error:', error);

            Cookies.remove('token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();

            toast.error('Logged out (with errors)');
            window.location.href = '/auth/login';
        }
    };

    const getUser = () => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    };

    const getToken = () => {
        return Cookies.get('token') || localStorage.getItem('token');
    };

    const isAuthenticated = () => {
        return !!getToken();
    };

    return {
        logout,
        getUser,
        getToken,
        isAuthenticated,
    };
}
