import { create } from "zustand";
import Cookies from "js-cookie";
import { decodeJwt } from "jose";

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
  /** Global feature toggles from SystemSettings table */
  systemSettings?: Record<string, boolean>;
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

  setUser: async (userData: DecodedUser) => {
    // Check if userdata is already "full" (has permissions and settings)
    const isFullProfile = !!(userData.rolePermissions && userData.systemSettings);
    
    // Merge: keep all existing claims + add new data
    set((state) => ({
      user: { ...state.user, ...userData },
      isLoggedIn: true,
      isLoading: !isFullProfile, // Only stay loading if we still need to fetch the full profile
    }));

    if (isFullProfile) {
      set({ isLoading: false });
      return;
    }

    // If it was just a partial user (e.g. from JWT decode), fetch the rest
    try {
      const fullUser = await fetchUserProfile(userData.id);
      set((state) => ({
        user: { ...state.user, ...fullUser },
        isLoading: false,
      }));
    } catch (error) {
      console.error("[AuthStore] Failed to fetch full user profile:", error);
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
  const store = useAuthStore.getState();
  
  // 1. If we already have a full user and are logged in, we can skip or do a background re-verify
  if (store.isLoggedIn && store.user?.rolePermissions) {
    // Optional: maybe do a silent fetch here if you want to ensure session is still valid
    return;
  }

  // 2. Try to populate from cookie immediately to avoid flashing loading screen
  const token = Cookies.get("token");
  if (token && !store.user) {
    try {
      const decoded = decodeJwt(token) as any;
      const userId = decoded.id || decoded.userId || decoded.sub;
      if (userId) {
        useAuthStore.setState({ 
          user: { ...decoded, id: userId }, 
          isLoggedIn: true,
          // We stay in isLoading: true because we need permissions for the dashboard
        });
      }
    } catch (e) {
      // Decode failed, token might be garbled
    }
  }

  // 3. Main fetch from /api/auth/me which returns the FULL profile
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await response.json();
    
    if (!response.ok || !data?.success || !data?.user) {
      useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });
      return;
    }
    
    // Update store with full user from API
    await useAuthStore.getState().setUser(data.user);
  } catch (err) {
    console.error("[AuthStore] checkAuth failed:", err);
    useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });
  }
};

export default useAuthStore;