import { create } from "zustand";
import Cookies from "js-cookie"; // Kept if you plan to use it later
// Import the regular function, NOT the hook

import verifyToken from "../lib/verifytoken";

const fetchUserById = async (id: string) => {
    const response = await fetch(`/api/users/profile/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }
    const data = await response.json();
    return data;
}


type DecodedUser = {
    id: string;
    userId?: string;
    email?: string;
    name?: string;
    role?: string;
    lastLogin?: string;
    permissions?: string[];
};

type AuthState = {
    user: DecodedUser | null;
    token: string | null;
    isLoggedIn: boolean;
    permissions: string[];
    // Updated signature: we don't return a Promise<void> explicitly in the type usually, but it's fine
    setUser: (user: DecodedUser) => Promise<void>;
    setToken: (token: string) => void;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    setPermissions: (permissions: string[]) => void;
    logout: () => Promise<void>; // Useful helper
};

const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isLoggedIn: false,
    permissions: [],

    setUser: async (partialUser: DecodedUser) => {
        try {

            set({ user: partialUser, isLoggedIn: true });


            const fullUserData = await fetchUserById(partialUser.id);


            set((state) => ({
                user: { ...state.user, ...fullUserData },
                permissions: fullUserData.permissions || [],
            }));
        } catch (error) {
            console.error("Failed to fetch full user details:", error);

        }
    },

    setToken: (token) => {
        Cookies.set('token', token); // Sync with cookies
        set({ token });
    },

    setIsLoggedIn: (status) => set({ isLoggedIn: status }),

    setPermissions: (p) => set({ permissions: p }),

    logout: async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error("Logout API call failed", error);
        }
        Cookies.remove('token');
        set({ user: null, token: null, isLoggedIn: false, permissions: [] });
        // Optional: Redirect to login page
        window.location.href = '/auth/login';
    }
}));

export const checkAuth = async () => {
    const token = Cookies.get("token");
    if (token) {
        const decoded = verifyToken(token) as any;
        if (decoded && (decoded.id || decoded.userId || decoded.sub)) {
            const id = decoded.id || decoded.userId || decoded.sub;
            const user: DecodedUser = {
                ...decoded,
                id: id
            };

            useAuthStore.getState().setToken(token);
            await useAuthStore.getState().setUser(user);
        } else {
            useAuthStore.getState().logout();
        }
    } else {
        useAuthStore.getState().logout();
    }
};

export default useAuthStore;