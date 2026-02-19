// Define all possible permissions
export const PERMISSIONS = {
    // User Management
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    USER_CHANGE_ROLE: 'user:change_role',

    // Hostel Management
    HOSTEL_VIEW: 'hostel:view',
    HOSTEL_CREATE: 'hostel:create',
    HOSTEL_UPDATE: 'hostel:update',
    HOSTEL_DELETE: 'hostel:delete',

    // Room Management
    ROOM_VIEW: 'room:view',
    ROOM_CREATE: 'room:create',
    ROOM_UPDATE: 'room:update',
    ROOM_DELETE: 'room:delete',

    // Booking Management
    BOOKING_VIEW: 'booking:view',
    BOOKING_VIEW_ALL: 'booking:view_all',
    BOOKING_CREATE: 'booking:create',
    BOOKING_UPDATE: 'booking:update',
    BOOKING_CANCEL: 'booking:cancel',

    // Payment Management
    PAYMENT_VIEW: 'payment:view',
    PAYMENT_VIEW_ALL: 'payment:view_all',
    PAYMENT_CREATE: 'payment:create',
    PAYMENT_APPROVE: 'payment:approve',
    PAYMENT_REJECT: 'payment:reject',

    // Salary Management
    SALARY_VIEW: 'salary:view',
    SALARY_CREATE: 'salary:create',
    SALARY_UPDATE: 'salary:update',
    SALARY_DELETE: 'salary:delete',

    // Expense Management
    EXPENSE_VIEW: 'expense:view',
    EXPENSE_CREATE: 'expense:create',
    EXPENSE_UPDATE: 'expense:update',
    EXPENSE_DELETE: 'expense:delete',

    // Report Access
    REPORT_VIEW_BUSINESS: 'report:view_business',
    REPORT_VIEW_HOSTEL: 'report:view_hostel',
    REPORT_EXPORT: 'report:export',

    // Complaint Management
    COMPLAINT_VIEW: 'complaint:view',
    COMPLAINT_VIEW_ALL: 'complaint:view_all',
    COMPLAINT_CREATE: 'complaint:create',
    COMPLAINT_RESOLVE: 'complaint:resolve',
    COMPLAINT_REJECT: 'complaint:reject',

    // System Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_UPDATE: 'settings:update',
} as const;

// Define role permissions
export const ROLE_PERMISSIONS = {
    ADMIN: [
        // Full access to everything
        ...Object.values(PERMISSIONS)
    ],

    WARDEN: [
        // User management (limited)
        PERMISSIONS.USER_VIEW,

        // Hostel management (assigned hostel only)
        PERMISSIONS.HOSTEL_VIEW,
        PERMISSIONS.HOSTEL_UPDATE,

        // Room management
        PERMISSIONS.ROOM_VIEW,
        PERMISSIONS.ROOM_CREATE,
        PERMISSIONS.ROOM_UPDATE,

        // Booking management
        PERMISSIONS.BOOKING_VIEW_ALL,
        PERMISSIONS.BOOKING_CREATE,
        PERMISSIONS.BOOKING_UPDATE,
        PERMISSIONS.BOOKING_CANCEL,

        // Payment management
        PERMISSIONS.PAYMENT_VIEW_ALL,
        PERMISSIONS.PAYMENT_APPROVE,
        PERMISSIONS.PAYMENT_REJECT,

        // Complaints
        PERMISSIONS.COMPLAINT_VIEW_ALL,
        PERMISSIONS.COMPLAINT_RESOLVE,
        PERMISSIONS.COMPLAINT_REJECT,

        // Reports (hostel only)
        PERMISSIONS.REPORT_VIEW_HOSTEL,
        PERMISSIONS.REPORT_EXPORT,
    ],

    STAFF: [
        // View access
        PERMISSIONS.USER_VIEW,
        PERMISSIONS.HOSTEL_VIEW,
        PERMISSIONS.ROOM_VIEW,
        PERMISSIONS.BOOKING_VIEW_ALL,
        PERMISSIONS.PAYMENT_VIEW_ALL,
        PERMISSIONS.COMPLAINT_VIEW_ALL,

        // Limited actions
        PERMISSIONS.BOOKING_CREATE,
        PERMISSIONS.COMPLAINT_RESOLVE,
    ],

    GUEST: [
        // Own data only
        PERMISSIONS.BOOKING_VIEW,
        PERMISSIONS.BOOKING_CREATE,
        PERMISSIONS.PAYMENT_VIEW,
        PERMISSIONS.COMPLAINT_VIEW,
        PERMISSIONS.COMPLAINT_CREATE,
    ]
} as const;

// Helper function to check if role has permission
export function hasPermission(role: string, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
    return permissions?.includes(permission as any) || false;
}

// Helper to get all permissions for a role
export function getRolePermissions(role: string): string[] {
    return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] as string[] || [];
}
