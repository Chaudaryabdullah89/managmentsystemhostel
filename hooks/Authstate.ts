import { create } from "zustand";
import Cookies from "js-cookie";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the decoded JWT payload + any server-fetched enrichment */
type DecodedUser = {
  id: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  hostelId?: string;
  lastLogin?: string;
  /** Role-level granular permissions from RolePermission table */
  rolePermissions?: Record<string, boolean>;
  /** Global feature toggles and branding from SystemSettings table */
  systemSettings?: Record<string, string | boolean | any>;
};

type AuthState = {
  user: DecodedUser | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  /** Fetch full user profile (with rolePermissions + systemSettings) and store it */
  setUser: (user: DecodedUser) => Promise<void>;
  setToken: (token: string | null) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  logout: () => Promise<void>;
};

// ─── Profile fetcher ──────────────────────────────────────────────────────────

const fetchUserProfile = async (id: string): Promise<DecodedUser> => {
  const response = await fetch(`/api/users/profile/${id}`, {
    // Tell Next.js to always revalidate so a fresh permissions snapshot is used
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Profile fetch failed: ${response.status}`);
  return response.json();
};

// ─── Store ────────────────────────────────────────────────────────────────────

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,

  setUser: async (partialUser: DecodedUser) => {
    // Immediately mark as logged in with the decoded JWT data
    set({ user: partialUser, isLoggedIn: true, isLoading: true });

    try {
      const fullUser = await fetchUserProfile(partialUser.id);
      // Merge: keep all JWT claims + add server-fetched rolePermissions & systemSettings
      set((state) => ({
        user: { ...state.user, ...fullUser },
        isLoading: false,
      }));
    } catch (error) {
      console.error("[AuthStore] Failed to fetch full user profile:", error);
      // Still mark loading as done so the UI doesn't spin forever
      set({ isLoading: false });
    }
  },

  setToken: (token) => set({ token }),

  setIsLoggedIn: (status) => set({ isLoggedIn: status }),

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("[AuthStore] Logout API call failed:", error);
    }
    Cookies.remove("token");
    set({ user: null, token: null, isLoggedIn: false, isLoading: false });
    window.location.href = "/auth/login";
  },
}));

// ─── checkAuth ────────────────────────────────────────────────────────────────

/**
 * Called once on dashboard mount. Reads the JWT from the cookie, decodes
 * it client-side (no secret needed — verifyToken uses decodeJwt, not verify),
 * then fetches the full profile with permissions from the server.
 *
 * NOTE: We do NOT call logout() if there is no token — that would redirect
 * users who land on a public page. The middleware handles unauthenticated
 * redirects for protected routes.
 */
export const checkAuth = async () => {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || !data?.success || !data?.user) {
      useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });
      return;
    }
    await useAuthStore.getState().setUser(data.user);
  } catch {
    useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });
  }
};

export default useAuthStore;