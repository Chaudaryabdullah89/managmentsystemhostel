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

export const NAVIGATION_ITEMS: Record<string, NavItem[]> = {
    admin: [
        { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, role: "admin" },
        { title: "All Hostels", url: "/admin/hostels", icon: Building2, role: "admin", permissionKey: "manage_hostels" },
        { title: "All Rooms", url: "/admin/hostels/rooms", icon: Bed, role: "admin", permissionKey: "manage_rooms" },
        { title: "All Bookings", url: "/admin/bookings", icon: Calendar, role: "admin", permissionKey: "manage_bookings", featureKey: "enableGuestBookings" },
        { title: "All Payments", url: "/admin/payments", icon: CreditCard, role: "admin", permissionKey: "manage_payments", featureKey: "enablePaymentProcessing" },
        { title: "Salaries (Staff)", url: "/admin/salaries", icon: DollarSign, role: "admin", permissionKey: "manage_salaries" },
        { title: "Salaries (Warden)", url: "/admin/warden-salaries", icon: Users, role: "admin", permissionKey: "manage_salaries" },
        { title: "Users Records", url: "/admin/users-records", icon: Users, role: "admin", permissionKey: "manage_users" },
        { title: "Hostels Reports", url: "/admin/reports", icon: FileText, role: "admin", permissionKey: "view_analytics" },
        { title: "Audit & Search", url: "/admin/audit", icon: Search, role: "admin" },
        { title: "Complaints", url: "/admin/complaints", icon: MessageSquare, role: "admin", permissionKey: "manage_complaints", featureKey: "enableComplaintsSystem" },
        { title: "Notice Board", url: "/admin/notices", icon: Megaphone, role: "admin", permissionKey: "manage_notices", featureKey: "enableNoticeBoard" },
        { title: "Expenses", url: "/admin/expenses", icon: DollarSign, role: "admin", permissionKey: "manage_expenses" },
        { title: "Mess Menu", url: "/admin/mess", icon: Utensils, role: "admin", permissionKey: "manage_mess", featureKey: "enableMess" },
        { title: "System Settings", url: "/admin/system-settings", icon: ShieldCheck, role: "admin" },
        { title: "Profile", url: "/admin/profile", icon: User, role: "admin" },
    ],
    warden: [
        { title: "Dashboard", url: "/warden", icon: LayoutDashboard, role: "warden" },
        { title: "My Hostel", url: "/warden/hostels", icon: Building2, role: "warden", permissionKey: "access_warden_hostel" },
        { title: "Rooms", url: "/warden/rooms", icon: Bed, role: "warden", permissionKey: "manage_rooms" },
        { title: "Bookings", url: "/warden/bookings", icon: Calendar, role: "warden", permissionKey: "view_bookings" },
        { title: "Payments", url: "/warden/payments", icon: CreditCard, role: "warden", permissionKey: "view_payments", featureKey: "enablePaymentProcessing" },
        { title: "Residents", url: "/warden/residents", icon: Users, role: "warden", permissionKey: "view_users" },
        // { title: "Cleaning Log", url: "/warden/cleaning", icon: Activity, role: "warden", permissionKey: "manage_cleaning" },
        // { title: "Laundry Hub", url: "/warden/laundry", icon: Sparkles, role: "warden", permissionKey: "manage_laundry", featureKey: "enableLaundry" },
        // { title: "Tasks", url: "/warden/tasks", icon: Wrench, role: "warden", permissionKey: "manage_maintenance", featureKey: "enableMaintenanceRequests" },
        { title: "Mess Menu", url: "/warden/mess", icon: Utensils, role: "warden", permissionKey: "manage_mess", featureKey: "enableMess" },
        { title: "Expenses", url: "/warden/expenses", icon: DollarSign, role: "warden", permissionKey: "manage_expenses" },
        { title: "Notice Board", url: "/warden/notices", icon: Megaphone, role: "warden", permissionKey: "manage_notices", featureKey: "enableNoticeBoard" },
        { title: "Audit Log", url: "/warden/audit", icon: Search, role: "warden", permissionKey: "access_warden_audit" },
        { title: "Complaints", url: "/warden/complaints", icon: MessageSquare, role: "warden", permissionKey: "manage_complaints", featureKey: "enableComplaintsSystem" },
        // { title: "Hostel Status", url: "/warden/services", icon: ShieldCheck, role: "warden", permissionKey: "view_analytics" },
        { title: "My Salary", url: "/warden/my-salary", icon: Wallet, role: "warden", permissionKey: "access_warden_salary" },
        { title: "My Profile", url: "/warden/profile", icon: User, role: "warden" },
    ],
    guest: [
        { title: "Dashboard", url: "/guest/dashboard", icon: LayoutDashboard, role: "guest" },
        { title: "My Room", url: "/guest/my-room", icon: Bed, role: "guest", permissionKey: "access_guest_room" },
        { title: "My Bookings", url: "/guest/bookings", icon: Calendar, role: "guest", permissionKey: "view_bookings", featureKey: "enableGuestBookings" },
        { title: "Payments", url: "/guest/payments", icon: CreditCard, role: "guest", permissionKey: "view_payments", featureKey: "enablePaymentProcessing" },
        { title: "Mess Schedule", url: "/guest/mess", icon: Utensils, role: "guest", permissionKey: "access_guest_mess", featureKey: "enableMess" },
        { title: "Services & Support", url: "/guest/support", icon: LifeBuoy, role: "guest", permissionKey: "access_guest_support" },
        { title: "Profile", url: "/guest/profile", icon: User, role: "guest" },
    ],
    resident: [
        { title: "Dashboard", url: "/guest/dashboard", icon: LayoutDashboard, role: "resident" },
        { title: "My Room", url: "/guest/my-room", icon: Bed, role: "resident", permissionKey: "access_guest_room" },
        { title: "My Bookings", url: "/guest/bookings", icon: Calendar, role: "resident", permissionKey: "view_bookings", featureKey: "enableGuestBookings" },
        { title: "Payments", url: "/guest/payments", icon: CreditCard, role: "resident", permissionKey: "view_payments", featureKey: "enablePaymentProcessing" },
        { title: "Mess Schedule", url: "/guest/mess", icon: Utensils, role: "resident", permissionKey: "access_guest_mess", featureKey: "enableMess" },
        { title: "Services & Support", url: "/guest/support", icon: LifeBuoy, role: "resident", permissionKey: "access_guest_support" },
        { title: "Profile", url: "/guest/profile", icon: User, role: "resident" },
    ],
    staff: [
        { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard, role: "staff" },
        { title: "My Salary", url: "/staff/salary", icon: DollarSign, role: "staff", permissionKey: "access_staff_salary" },
        { title: "My Profile", url: "/staff/profile", icon: User, role: "staff" },
    ],
};
