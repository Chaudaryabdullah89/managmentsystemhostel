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
  /** Global feature toggles and branding from SystemSettings table */
  systemSettings?: Record<string, string | boolean | number>;
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

/** Timestamp of the last successful background refresh — throttles to 1 call/30s */
let _lastBgRefresh = 0;
const BG_REFRESH_INTERVAL_MS = 30_000;

/**
 * Called on dashboard mount and on every route change. Reads the JWT from the
 * cookie, decodes it client-side, then fetches the full profile with permissions
 * and system settings from the server.
 *
 * When the user is already logged in, a non-blocking background refresh is
 * performed (throttled to once every 30 s) so that admin system-setting changes
 * (feature toggles, email service switches, etc.) propagate to all active
 * sessions without requiring a page reload or re-login.
 *
 * NOTE: We do NOT call logout() if there is no token — that would redirect
 * users who land on a public page. The middleware handles unauthenticated
 * redirects for protected routes.
 */
export const checkAuth = async (force: boolean = false) => {
  const store = useAuthStore.getState();
  
  // 1. If already logged in with full profile, do a throttled silent background refresh.
  //    force=true bypasses the throttle and awaits the result (e.g., right after saving settings).
  if (!force && store.isLoggedIn && store.user?.rolePermissions) {
    const now = Date.now();
    if (now - _lastBgRefresh < BG_REFRESH_INTERVAL_MS) return; // Throttle
    _lastBgRefresh = now;

    // Silent background refresh — updates systemSettings without blocking navigation
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.user) {
          // Merge fresh systemSettings + rolePermissions into store without touching isLoading
          useAuthStore.setState((state) => ({
            user: { ...state.user, ...data.user },
            isLoggedIn: true,
          }));
        }
      })
      .catch(() => {/* Silent — don't interrupt the user's session on network blip */});
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
    
    // Update store with full user from API + reset throttle clock
    _lastBgRefresh = Date.now();
    await useAuthStore.getState().setUser(data.user);
  } catch (err) {
    console.error("[AuthStore] checkAuth failed:", err);
    useAuthStore.setState({ user: null, token: null, isLoggedIn: false, isLoading: false });
  }
};

export default useAuthStore;