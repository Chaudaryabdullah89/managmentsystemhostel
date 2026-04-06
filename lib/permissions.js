import { prisma } from '@/lib/prisma';
import { checkRole } from '@/lib/checkRole';

// ─── Default settings (mirrors Prisma schema defaults) ────────────────────
const DEFAULT_SETTINGS = {
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

  // ─── Email Services
  enableEmailService: true,
  enablePasswordResetEmails: true,
  enableBookingEmails: true,
  enablePaymentEmails: true,
  enableComplaintEmails: true,
  enableNoticeEmails: true,
  enableWelcomeEmails: true,
};

// ─── Default role permissions ─────────────────────────────────────────────
export const DEFAULT_ROLE_PERMISSIONS = {
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
  },
  STAFF: {
    view_bookings: true,
    view_users: true,
    manage_laundry: true,
    manage_complaints: true,
    manage_maintenance: true,
    access_staff_salary: true,
  },
  RESIDENT: {
    view_bookings: true,
    view_payments: true,
    access_guest_room: true,
    access_guest_mess: true,
    access_guest_support: true,
  },
  GUEST: {
    view_bookings: false,
    view_payments: false,
    access_guest_room: true,
    access_guest_mess: false,
    access_guest_support: true,
  },
  ADMIN: {
    // Admin essentially has everything true, but we hardcode the bypass anyway
  }
};

// ─── getSystemSettings ────────────────────────────────────────────────────
/**
 * Fetches the global singleton SystemSettings from DB.
 * Falls back to safe defaults if none created yet (e.g., first boot).
 */
export async function getSystemSettings() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'global' }
    });
    if (!settings) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// ─── isServiceEnabled ─────────────────────────────────────────────────────
/**
 * Check if a specific global service is enabled.
 * 
 * @param {string} featureKey - e.g. 'enableLaundry', 'enableEmailService'
 * @returns {Promise<boolean>}
 * 
 * @example
 *   // In an API route:
 *   if (!await isServiceEnabled('enablePasswordResetEmails')) {
 *     return NextResponse.json({ message: 'Email service is disabled' }, { status: 503 });
 *   }
 */
export async function isServiceEnabled(featureKey) {
  // Always permit ADMIN and SUPER_ADMIN to bypass service toggles
  try {
    const auth = await checkRole();
    if (auth.success && auth.user?.role === 'ADMIN') {
      return true;
    }
  } catch {
    // Fail silently, proceed to check global setting
  }

  const settings = await getSystemSettings();
  // If email sub-feature is requested, also check master email switch
  const emailSubKeys = [
    'enablePasswordResetEmails', 'enableBookingEmails', 'enablePaymentEmails',
    'enableComplaintEmails', 'enableNoticeEmails', 'enableWelcomeEmails',
  ];
  if (emailSubKeys.includes(featureKey) && !settings.enableEmailService) {
    return false; // Master email switch overrides
  }
  return settings[featureKey] ?? true;
}

// ─── hasPermission ────────────────────────────────────────────────────────
/**
 * Validates if the currently authenticated user has a specific granular permission.
 * SUPER_ADMIN always returns true.
 *
 * @param {string} requiredPermissionKey - e.g., 'manage_rooms', 'view_analytics'
 * @returns {Promise<boolean>}
 */
export async function hasPermission(requiredPermissionKey) {
  const auth = await checkRole();
  if (!auth.success || !auth.user?.role) return false;

  const userRole = auth.user.role;
  if (userRole === 'ADMIN') return true;

  try {
    const roleRecord = await prisma.rolePermission.findUnique({
      where: { role: userRole },
    });

    let perms = {};
    if (roleRecord?.permissions) {
      perms = typeof roleRecord.permissions === 'object'
        ? roleRecord.permissions
        : JSON.parse(roleRecord.permissions);
    } else {
      perms = DEFAULT_ROLE_PERMISSIONS[userRole] || {};
    }

    return !!perms[requiredPermissionKey];
  } catch {
    return !!(DEFAULT_ROLE_PERMISSIONS[userRole]?.[requiredPermissionKey]);
  }
}

// ─── getMyPermissions ────────────────────────────────────────────────────
/**
 * Returns the full permissions object for the current user's role.
 * Pass this to client components via Server Component props.
 */
export async function getMyPermissions() {
  const auth = await checkRole();
  if (!auth.success || !auth.user?.role) return {};

  const userRole = auth.user.role;
  if (userRole === 'ADMIN') return { isSuperAdmin: true };

  try {
    const roleRecord = await prisma.rolePermission.findUnique({
      where: { role: userRole },
    });
    
    if (roleRecord?.permissions) {
      return typeof roleRecord.permissions === 'object'
        ? roleRecord.permissions
        : JSON.parse(roleRecord.permissions);
    }
    
    return DEFAULT_ROLE_PERMISSIONS[userRole] || {};
  } catch {
    return DEFAULT_ROLE_PERMISSIONS[userRole] || {};
  }
}
