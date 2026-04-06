import React from 'react';
import { hasPermission, getSystemSettings } from '@/lib/permissions';
import { checkRole } from '@/lib/checkRole';

/**
 * FeatureGuard (Server Component)
 * 
 * Conditionally renders children if the authenticated user 
 * has the specified permission key, OR if the system feature is globally enabled.
 * 
 * @param {Object} props
 * @param {string} [props.permissionKey] - Required role permission (e.g., 'manage_rooms')
 * @param {string} [props.featureKey] - Required global system setting (e.g., 'enableLaundry')
 * @param {React.ReactNode} [props.fallback] - Displayed if permission is denied
 */
export default async function FeatureGuard({
  children,
  permissionKey,
  featureKey,
  fallback = null
}) {
  // If a global feature key is specified, check SystemSettings
  if (featureKey) {
    const settings = await getSystemSettings();
    if (!settings[featureKey]) {
      return fallback; 
    }
  }

  // If a permission key is specified, check against RolePermission matrix
  if (permissionKey) {
    const isGranted = await hasPermission(permissionKey);
    if (!isGranted) {
      return fallback;
    }
  }

  // If it passes both (or neither are supplied), render children
  return <>{children}</>;
}
