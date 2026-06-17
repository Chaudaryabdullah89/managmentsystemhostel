import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";

// ─── All valid granular permission keys ──────────────────────────────────────
/** @type {readonly string[]} */
export const ALL_PERMISSION_KEYS = [
  // Analytics & Reporting
  "view_analytics",
  // Hostel / Property
  "manage_hostels",
  "manage_rooms",
  // Bookings
  "view_bookings",
  "manage_bookings",
  // Users
  "view_users",
  "manage_users",
  // Finance
  "view_payments",
  "manage_payments",
  "view_expenses",
  "manage_expenses",
  "manage_salaries",
  // Operations
  "manage_mess",
  "manage_laundry",
  "manage_cleaning",
  "manage_complaints",
  "manage_maintenance",
  "manage_notices",
  // Warden-specific
  "access_warden_hostel",
  "access_warden_salary",
  "access_warden_audit",
  // Staff-specific
  "access_staff_salary",
  // Guest/Resident-specific
  "access_guest_room",
  "access_guest_mess",
  "access_guest_support",
];

// ─── Default settings (mirrors Prisma schema defaults) ────────────────────────
export const DEFAULT_SETTINGS = {
  // Maintenance
  maintenanceMode: false,
  maintenanceMessage: "",

  // Core Services
  enableLaundry: true,
  enableMess: true,
  enableGuestBookings: true,
  enableComplaintsSystem: true,
  enableMaintenanceRequests: true,
  enableRefundRequests: true,
  enableNoticeBoard: true,
  enableAiAssistant: true,
  enablePaymentProcessing: true,
  autoGenerateRentInvoices: true,
  autoGenerateStaffSalaries: true,

  // Email Services
  enableEmailService: true,
  enablePasswordResetEmails: true,
  enableBookingEmails: true,
  enablePaymentEmails: true,
  enableComplaintEmails: true,
  enableNoticeEmails: true,
  enableWelcomeEmails: true,

  // Branding
  companyName: "Hostel Management System",
  companyShortName: "HMS",
};

// ─── Default role permissions ──────────────────────────────────────────────────
// ADMIN: all keys set to true (single source of truth)
const _adminPerms = Object.fromEntries(
  ALL_PERMISSION_KEYS.map((k) => [k, true]),
);

export const DEFAULT_ROLE_PERMISSIONS = {
  ADMIN: _adminPerms,

  WARDEN: {
    view_analytics: true,
    manage_hostels: false,
    manage_rooms: true,
    view_bookings: true,
    manage_bookings: true,
    view_users: true,
    manage_users: true,
    view_payments: true,
    manage_payments: true,
    view_expenses: true,
    manage_expenses: true,
    manage_salaries: true,
    manage_mess: true,
    manage_laundry: true,
    manage_cleaning: true,
    manage_complaints: true,
    manage_maintenance: true,
    manage_notices: true,
    access_warden_hostel: true,
    access_warden_salary: true,
    access_warden_audit: true,
    // staff / guest keys default false
    access_staff_salary: false,
    access_guest_room: false,
    access_guest_mess: false,
    access_guest_support: false,
  },

  STAFF: {
    view_bookings: true,
    view_users: true,
    manage_laundry: true,
    manage_cleaning: true,
    manage_complaints: true,
    manage_maintenance: true,
    access_staff_salary: true,
    // everything else false by default
    view_analytics: false,
    manage_hostels: false,
    manage_rooms: false,
    manage_bookings: false,
    manage_users: false,
    view_payments: false,
    manage_payments: false,
    view_expenses: false,
    manage_expenses: false,
    manage_salaries: false,
    manage_mess: false,
    manage_notices: false,
    access_warden_hostel: false,
    access_warden_salary: false,
    access_warden_audit: false,
    access_guest_room: false,
    access_guest_mess: false,
    access_guest_support: false,
  },

  RESIDENT: {
    view_bookings: true,
    view_payments: true,
    access_guest_room: true,
    access_guest_mess: true,
    access_guest_support: true,
    // everything else false
    view_analytics: false,
    manage_hostels: false,
    manage_rooms: false,
    manage_bookings: false,
    view_users: false,
    manage_users: false,
    manage_payments: false,
    view_expenses: false,
    manage_expenses: false,
    manage_salaries: false,
    manage_mess: false,
    manage_laundry: false,
    manage_cleaning: false,
    manage_complaints: false,
    manage_maintenance: false,
    manage_notices: false,
    access_warden_hostel: false,
    access_warden_salary: false,
    access_warden_audit: false,
    access_staff_salary: false,
  },

  GUEST: {
    view_bookings: false,
    view_payments: false,
    access_guest_room: true,
    access_guest_mess: false,
    access_guest_support: true,
    // everything else false
    view_analytics: false,
    manage_hostels: false,
    manage_rooms: false,
    manage_bookings: false,
    view_users: false,
    manage_users: false,
    manage_payments: false,
    view_expenses: false,
    manage_expenses: false,
    manage_salaries: false,
    manage_mess: false,
    manage_laundry: false,
    manage_cleaning: false,
    manage_complaints: false,
    manage_maintenance: false,
    manage_notices: false,
    access_warden_hostel: false,
    access_warden_salary: false,
    access_warden_audit: false,
    access_staff_salary: false,
  },
};

// ─── Cached DB fetchers (one DB call per request, not per component) ──────────

/**
 * Internal fetcher for system settings
 */
async function fetchSystemSettings() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "global" },
    });
    if (!settings) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Fetches SystemSettings with multi-layer caching:
 * 1. unstable_cache: Persists across requests (revalidates every 1h)
 * 2. React cache(): Persists within a single request
 */
export const getSystemSettings = cache(
  unstable_cache(
    async () => fetchSystemSettings(),
    ["system-settings"],
    { revalidate: 3600, tags: ["settings"] }
  )
);

/**
 * Specifically returns branding fields for use in emails/UI.
 */
export const getBranding = async () => {
  const settings = await getSystemSettings();
  return {
    companyName: settings.companyName || DEFAULT_SETTINGS.companyName,
    companyShortName: settings.companyShortName || DEFAULT_SETTINGS.companyShortName,
  };
};

/**
 * Internal fetcher for role permissions
 */
async function fetchPermissionsForRole(role) {
  if (!role) return {};
  if (role === "ADMIN") return DEFAULT_ROLE_PERMISSIONS["ADMIN"];
  try {
    const record = await prisma.rolePermission.findUnique({ where: { role } });
    if (record?.permissions) {
      const stored =
        typeof record.permissions === "object"
          ? record.permissions
          : JSON.parse(record.permissions);
      // Merge with defaults so any newly added keys always exist
      return { ...(DEFAULT_ROLE_PERMISSIONS[role] || {}), ...stored };
    }
    return DEFAULT_ROLE_PERMISSIONS[role] || {};
  } catch {
    return DEFAULT_ROLE_PERMISSIONS[role] || {};
  }
}

/**
 * Fetches the RolePermission record with multi-layer caching.
 *
 * @param {string} role
 * @returns {Promise<Record<string,boolean>>}
 */
const cachedFetchPermissionsForRole = unstable_cache(
  async (role) => fetchPermissionsForRole(role),
  ["role-permissions"],
  { revalidate: 3600, tags: ["permissions"] }
);

export const getPermissionsForRole = cache(
  async (role) => {
    if (!role) return {};
    return cachedFetchPermissionsForRole(role);
  }
);

// ─── isServiceEnabled ─────────────────────────────────────────────────────────
/**
 * Check if a specific global service is enabled.
 * ADMIN bypasses all feature toggles.
 *
 * @param {string} featureKey - e.g. 'enableLaundry', 'enableEmailService'
 * @returns {Promise<boolean>}
 */
export async function isServiceEnabled(featureKey) {
  const settings = await getSystemSettings();

  // If an email sub-feature is requested, also check the master email switch
  const emailSubKeys = [
    "enablePasswordResetEmails",
    "enableBookingEmails",
    "enablePaymentEmails",
    "enableComplaintEmails",
    "enableNoticeEmails",
    "enableWelcomeEmails",
  ];
  if (emailSubKeys.includes(featureKey) && !settings.enableEmailService) {
    return false;
  }

  return settings[featureKey] ?? true;
}

// ─── hasPermission ─────────────────────────────────────────────────────────────
/**
 * Validates if the currently authenticated user has a specific granular permission.
 * ADMIN always returns true.
 *
 * @param {string} requiredPermissionKey - e.g., 'manage_rooms', 'view_analytics'
 * @returns {Promise<boolean>}
 */
export async function hasPermission(requiredPermissionKey) {
  const auth = await checkRole();
  if (!auth.success || !auth.user?.role) return false;

  const userRole = auth.user.role;
  if (userRole === "ADMIN") return true;

  const perms = await getPermissionsForRole(userRole);
  return !!perms[requiredPermissionKey];
}

// ─── getMyPermissions ─────────────────────────────────────────────────────────
/**
 * Returns the full permissions object for the current user's role.
 * Pass this to client components via Server Component props.
 *
 * @returns {Promise<Record<string,boolean> & { isSuperAdmin?: boolean }>}
 */
export async function getMyPermissions() {
  const auth = await checkRole();
  if (!auth.success || !auth.user?.role) return {};

  const userRole = auth.user.role;
  if (userRole === "ADMIN")
    return { isSuperAdmin: true, ...DEFAULT_ROLE_PERMISSIONS["ADMIN"] };

  return await getPermissionsForRole(userRole);
}

// ─── buildDefaultPermissionsPayload ──────────────────────────────────────────
/**
 * Returns the canonical default permissions object for a given role.
 * Used by the permissions API reset endpoint.
 *
 * @param {string} role
 * @returns {Record<string,boolean> | null}
 */
export function buildDefaultPermissionsPayload(role) {
  return DEFAULT_ROLE_PERMISSIONS[role] || null;
}
