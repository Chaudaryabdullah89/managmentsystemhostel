"use client";

/**
 * AuthContext.jsx — DEPRECATED
 *
 * This context was replaced by `hooks/Authstate.ts` (Zustand store) +
 * `hooks/usePermissions.ts` which are the canonical client-side auth solution.
 *
 * Kept here for any legacy components that may still import `useAuth`.
 * All NEW components should use:
 *   - useAuthStore()     → for user, isLoggedIn, logout, isLoading
 *   - usePermissions()  → for can(), featureEnabled(), canAll(), canAny()
 *
 * SECURITY NOTE: The previous version of this file used NEXT_PUBLIC_JWT_SECRET
 * to verify JWT signatures on the client side — this exposed the secret to
 * the browser. This version no longer does that. Token reads are decode-only
 * (no signature check) on the client; actual signature verification only
 * happens server-side in middleware.ts and checkRole.js.
 */

import React, { createContext, useContext } from "react";
import useAuthStore from "@/hooks/Authstate";
import { usePermissions } from "@/hooks/usePermissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Delegate all state to Zustand — no duplicate state
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * @deprecated Use `useAuthStore()` from `@/hooks/Authstate` instead.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}