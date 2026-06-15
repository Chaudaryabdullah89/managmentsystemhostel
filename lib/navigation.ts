import {
    Bed,
    Building2,
    Calendar,
    CreditCard,
    DollarSign,
    FileText,
    LayoutDashboard,
    LifeBuoy,
    MessageSquare,
    User,
    Users,
    Search,
    Utensils,
    Megaphone,
    Wallet,
    ShieldCheck,
    Activity,
    Sparkles,
    Wrench,
    BarChart3,
    Settings,
    type LucideIcon,
} from "lucide-react";

export type NavItem = {
    title: string;
    url: string;
    icon: LucideIcon;
    badge?: string;
    role: string;
    permissionKey?: string;
    featureKey?: string;
};

export type NavGroup = {
    title: string;
    icon: LucideIcon;
    items: NavItem[];
};

// ─── Grouped navigation ────────────────────────────────────────────────────
export const NAVIGATION_GROUPS: Record<string, NavGroup[]> = {
    admin: [
        {
            title: "Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, role: "admin" },
            ],
        },
        {
            title: "Property",
            icon: Building2,
            items: [
                { title: "All Hostels", url: "/admin/hostels", icon: Building2, role: "admin", permissionKey: "manage_hostels" },
                { title: "All Rooms",   url: "/admin/hostels/rooms", icon: Bed, role: "admin", permissionKey: "manage_rooms" },
            ],
        },
        {
            title: "Operations",
            icon: Calendar,
            items: [
                { title: "Bookings",     url: "/admin/bookings",   icon: Calendar,      role: "admin", permissionKey: "manage_bookings",  featureKey: "enableGuestBookings" },
                { title: "Room Swaps",   url: "/admin/room-swaps", icon: Sparkles,      role: "admin", permissionKey: "manage_bookings" },
                { title: "Complaints",   url: "/admin/complaints", icon: MessageSquare, role: "admin", permissionKey: "manage_complaints", featureKey: "enableComplaintsSystem" },
                { title: "Notice Board", url: "/admin/notices",    icon: Megaphone,     role: "admin", permissionKey: "manage_notices",    featureKey: "enableNoticeBoard" },
                { title: "Mess Menu",    url: "/admin/mess",       icon: Utensils,      role: "admin", permissionKey: "manage_mess",       featureKey: "enableMess" },
            ],
        },
        {
            title: "Finance",
            icon: CreditCard,
            items: [
                { title: "Payments",          url: "/admin/payments",       icon: CreditCard, role: "admin", permissionKey: "manage_payments", featureKey: "enablePaymentProcessing" },
                { title: "Salaries (Staff)",  url: "/admin/salaries",       icon: DollarSign, role: "admin", permissionKey: "manage_salaries" },
                { title: "Salaries (Warden)", url: "/admin/warden-salaries",icon: Users,      role: "admin", permissionKey: "manage_salaries" },
                { title: "Expenses",          url: "/admin/expenses",       icon: Wallet,     role: "admin", permissionKey: "manage_expenses" },
                { title: "Financials Dashboard", url: "/admin/financials",  icon: BarChart3,  role: "admin", permissionKey: "view_analytics" },
            ],
        },
        {
            title: "People",
            icon: Users,
            items: [
                { title: "Users Records", url: "/admin/users-records", icon: Users, role: "admin", permissionKey: "manage_users" },
            ],
        },
        {
            title: "Analytics",
            icon: BarChart3,
            items: [
                { title: "Reports",       url: "/admin/reports", icon: FileText, role: "admin", permissionKey: "view_analytics" },
                { title: "Audit & Search",url: "/admin/audit",   icon: Search,   role: "admin" },
            ],
        },
        {
            title: "System",
            icon: Settings,
            items: [
                { title: "Settings", url: "/admin/system-settings", icon: ShieldCheck, role: "admin" },
                { title: "Profile",  url: "/admin/profile",         icon: User,        role: "admin" },
            ],
        },
    ],

    warden: [
        {
            title: "Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", url: "/warden", icon: LayoutDashboard, role: "warden" },
            ],
        },
        {
            title: "Property",
            icon: Building2,
            items: [
                { title: "My Hostel", url: "/warden/hostels", icon: Building2, role: "warden", permissionKey: "access_warden_hostel" },
                { title: "Rooms",     url: "/warden/rooms",   icon: Bed,       role: "warden", permissionKey: "manage_rooms" },
            ],
        },
        {
            title: "Operations",
            icon: Calendar,
            items: [
                { title: "Bookings",     url: "/warden/bookings",   icon: Calendar,      role: "warden", permissionKey: "view_bookings" },
                { title: "Residents",    url: "/warden/residents",  icon: Users,         role: "warden", permissionKey: "view_users" },
                { title: "Room Swaps",   url: "/warden/room-swaps", icon: Sparkles,      role: "warden", permissionKey: "view_bookings" },
                { title: "Complaints",   url: "/warden/complaints", icon: MessageSquare, role: "warden", permissionKey: "manage_complaints", featureKey: "enableComplaintsSystem" },
                { title: "Notice Board", url: "/warden/notices",    icon: Megaphone,     role: "warden", permissionKey: "manage_notices",    featureKey: "enableNoticeBoard" },
                { title: "Mess Menu",    url: "/warden/mess",       icon: Utensils,      role: "warden", permissionKey: "manage_mess",       featureKey: "enableMess" },
            ],
        },
        {
            title: "Finance",
            icon: CreditCard,
            items: [
                { title: "Payments",  url: "/warden/payments",  icon: CreditCard, role: "warden", permissionKey: "view_payments",        featureKey: "enablePaymentProcessing" },
                { title: "Expenses",  url: "/warden/expenses",  icon: Wallet,     role: "warden", permissionKey: "manage_expenses" },
                { title: "My Salary", url: "/warden/my-salary", icon: DollarSign, role: "warden", permissionKey: "access_warden_salary" },
            ],
        },
        {
            title: "Analytics",
            icon: Search,
            items: [
                { title: "Audit Log", url: "/warden/audit", icon: Search, role: "warden", permissionKey: "access_warden_audit" },
            ],
        },
        {
            title: "Account",
            icon: User,
            items: [
                { title: "My Profile", url: "/warden/profile", icon: User, role: "warden" },
            ],
        },
    ],

    guest: [
        {
            title: "Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", url: "/guest/dashboard", icon: LayoutDashboard, role: "guest" },
            ],
        },
        {
            title: "My Stay",
            icon: Bed,
            items: [
                { title: "My Room",     url: "/guest/my-room",  icon: Bed,      role: "guest", permissionKey: "access_guest_room" },
                { title: "My Bookings", url: "/guest/bookings", icon: Calendar, role: "guest", permissionKey: "view_bookings", featureKey: "enableGuestBookings" },
            ],
        },
        {
            title: "Services",
            icon: LifeBuoy,
            items: [
                { title: "Payments",         url: "/guest/payments", icon: CreditCard, role: "guest", permissionKey: "view_payments",      featureKey: "enablePaymentProcessing" },
                { title: "Mess Schedule",    url: "/guest/mess",     icon: Utensils,   role: "guest", permissionKey: "access_guest_mess",  featureKey: "enableMess" },
                { title: "Support",          url: "/guest/support",  icon: LifeBuoy,   role: "guest", permissionKey: "access_guest_support" },
            ],
        },
        {
            title: "Account",
            icon: User,
            items: [
                { title: "Profile", url: "/guest/profile", icon: User, role: "guest" },
            ],
        },
    ],

    resident: [
        {
            title: "Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", url: "/guest/dashboard", icon: LayoutDashboard, role: "resident" },
            ],
        },
        {
            title: "My Stay",
            icon: Bed,
            items: [
                { title: "My Room",     url: "/guest/my-room",  icon: Bed,      role: "resident", permissionKey: "access_guest_room" },
                { title: "My Bookings", url: "/guest/bookings", icon: Calendar, role: "resident", permissionKey: "view_bookings", featureKey: "enableGuestBookings" },
            ],
        },
        {
            title: "Services",
            icon: LifeBuoy,
            items: [
                { title: "Payments",      url: "/guest/payments", icon: CreditCard, role: "resident", permissionKey: "view_payments",      featureKey: "enablePaymentProcessing" },
                { title: "Mess Schedule", url: "/guest/mess",     icon: Utensils,   role: "resident", permissionKey: "access_guest_mess",  featureKey: "enableMess" },
                { title: "Support",       url: "/guest/support",  icon: LifeBuoy,   role: "resident", permissionKey: "access_guest_support" },
            ],
        },
        {
            title: "Account",
            icon: User,
            items: [
                { title: "Profile", url: "/guest/profile", icon: User, role: "resident" },
            ],
        },
    ],

    staff: [
        {
            title: "Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard, role: "staff" },
            ],
        },
        {
            title: "Account",
            icon: User,
            items: [
                { title: "My Salary",  url: "/staff/salary",  icon: DollarSign, role: "staff", permissionKey: "access_staff_salary" },
                { title: "My Profile", url: "/staff/profile", icon: User,       role: "staff" },
            ],
        },
    ],
};

// ─── Flat list (kept for backward compat if needed) ────────────────────────
export type NavItem_ = NavItem; // alias
export const NAVIGATION_ITEMS: Record<string, NavItem[]> = Object.fromEntries(
    Object.entries(NAVIGATION_GROUPS).map(([role, groups]) => [
        role,
        groups.flatMap((g) => g.items),
    ])
);
