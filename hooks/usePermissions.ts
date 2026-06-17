"use client";

import useAuthStore from "@/hooks/Authstate";

/**
 * usePermissions — client-side hook to check role/feature permissions.
 *
 * Reads from the `user.rolePermissions` and `user.systemSettings` objects
 * that are loaded once from `/api/users/profile/[id]` on login.
 *
 * @example
 * const { can, isAdmin, featureEnabled, role, isLoading } = usePermissions();
 *
 * if (can("manage_expenses")) { ... }
 * if (featureEnabled("enableMess")) { ... }
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  const role = user?.role ?? null;
  const isAdmin = role === "ADMIN";
  const rolePermissions: Record<string, boolean> = (user as any)?.rolePermissions ?? {};
  const systemSettings: Record<string, boolean> = (user as any)?.systemSettings ?? {};

  /**
   * Check if the current user has a specific granular permission.
   * ADMIN always returns true; unauthenticated always returns false.
   * While permissions are still loading, returns false (safe default).
   *
   * @param permissionKey - e.g. 'manage_rooms', 'view_analytics'
   */
  function can(permissionKey: string): boolean {
    if (isLoading) return false;
    if (!role) return false;
    if (isAdmin) return true;
    return !!rolePermissions[permissionKey];
  }

  /**
   * Check if a global system feature is enabled.
   * ADMIN bypasses feature toggles.
   *
   * @param featureKey - e.g. 'enableMess', 'enablePaymentProcessing'
   */
  function featureEnabled(featureKey: string): boolean {
    return systemSettings[featureKey] !== false; // default true if undefined
  }

  /**
   * Check multiple permissions at once — returns true only if ALL are granted.
   */
  function canAll(...permissionKeys: string[]): boolean {
    return permissionKeys.every((k) => can(k));
  }

  /**
   * Check multiple permissions at once — returns true if ANY is granted.
   */
  function canAny(...permissionKeys: string[]): boolean {
    return permissionKeys.some((k) => can(k));
  }

  return {
    role,
    isAdmin,
    isLoading,
    can,
    canAll,
    canAny,
    featureEnabled,
    rolePermissions,
    systemSettings,
  };
}
