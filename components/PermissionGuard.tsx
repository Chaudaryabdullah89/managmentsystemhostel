"use client";

import React from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldAlert } from "lucide-react";

interface PermissionGuardProps {
  /** Granular permission key (e.g. 'manage_rooms'). User must have this. */
  permissionKey?: string;
  /** Global feature toggle key (e.g. 'enableMess'). Feature must be enabled. */
  featureKey?: string;
  /** Multiple permission keys — all must be granted (AND logic). */
  allOf?: string[];
  /** Multiple permission keys — at least one must be granted (OR logic). */
  anyOf?: string[];
  /** Custom fallback UI. Defaults to an inline "Access Restricted" notice. */
  fallback?: React.ReactNode;
  /** If true, renders nothing (null) instead of the default fallback when access is denied. */
  silent?: boolean;
  children: React.ReactNode;
}

/**
 * PermissionGuard — client-side permission gate for React components.
 *
 * Can check a single permissionKey, a featureKey, allOf (AND), or anyOf (OR).
 * While permissions are loading, renders nothing to avoid flicker.
 *
 * @example
 * // Single key
 * <PermissionGuard permissionKey="manage_rooms">
 *   <RoomManager />
 * </PermissionGuard>
 *
 * @example
 * // Feature flag
 * <PermissionGuard featureKey="enableMess">
 *   <MessSchedule />
 * </PermissionGuard>
 *
 * @example
 * // Require any of several permissions (OR)
 * <PermissionGuard anyOf={["manage_expenses", "view_expenses"]}>
 *   <ExpenseSection />
 * </PermissionGuard>
 *
 * @example
 * // Silent — render nothing if denied
 * <PermissionGuard permissionKey="manage_users" silent>
 *   <DeleteUserButton />
 * </PermissionGuard>
 */
export function PermissionGuard({
  permissionKey,
  featureKey,
  allOf,
  anyOf,
  fallback,
  silent = false,
  children,
}: PermissionGuardProps) {
  const { can, canAll, canAny, featureEnabled, isLoading } = usePermissions();

  // While the user profile/permissions are being fetched, render nothing
  if (isLoading) return null;

  // ── Check feature flag ────────────────────────────────────────────────────
  if (featureKey && !featureEnabled(featureKey)) {
    if (silent) return null;
    return <>{fallback ?? <DefaultFallback reason="feature" />}</>;
  }

  // ── Check single permission ───────────────────────────────────────────────
  if (permissionKey && !can(permissionKey)) {
    if (silent) return null;
    return <>{fallback ?? <DefaultFallback reason="permission" />}</>;
  }

  // ── Check allOf (AND) ─────────────────────────────────────────────────────
  if (allOf && allOf.length > 0 && !canAll(...allOf)) {
    if (silent) return null;
    return <>{fallback ?? <DefaultFallback reason="permission" />}</>;
  }

  // ── Check anyOf (OR) ─────────────────────────────────────────────────────
  if (anyOf && anyOf.length > 0 && !canAny(...anyOf)) {
    if (silent) return null;
    return <>{fallback ?? <DefaultFallback reason="permission" />}</>;
  }

  return <>{children}</>;
}

// ── Default inline fallback ──────────────────────────────────────────────────
function DefaultFallback({ reason }: { reason: "permission" | "feature" }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <span>
        {reason === "feature"
          ? "This feature is currently disabled."
          : "You don't have permission to view this."}
      </span>
    </div>
  );
}
