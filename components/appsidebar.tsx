"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
    LogOut,
    Search,
    ClipboardList,
    ChevronRight,
    type LucideIcon,
} from "lucide-react"
import useAuthStore from "@/hooks/Authstate"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
    title: string
    url: string
    icon: LucideIcon
    badge?: string
    role: string
}

const items: Record<string, NavItem[]> = {
    admin: [
        { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, role: "admin" },
        { title: "All Hostels", url: "/admin/hostels", icon: Building2, role: "admin" },
        { title: "All Rooms", url: "/admin/hostels/rooms", icon: Bed, role: "admin" },
        { title: "All Bookings", url: "/admin/bookings", icon: Calendar, role: "admin" },
        { title: "All Payments", url: "/admin/payments", icon: CreditCard, role: "admin" },
        { title: "Salaries", url: "/admin/salaries", icon: DollarSign, role: "admin" },
        { title: "Staff", url: "/admin/staff", icon: Users, role: "admin" },
        { title: "Users Records", url: "/admin/users-records", icon: Users, role: "admin" },
        { title: "Reports", url: "/admin/reports", icon: FileText, role: "admin" },
        { title: "Audit & Search", url: "/admin/audit", icon: Search, role: "admin" },
        { title: "Complaints", url: "/admin/complaints", icon: MessageSquare, role: "admin" },
        { title: "Expenses", url: "/admin/expenses", icon: DollarSign, role: "admin" },
        { title: "Profile", url: "/admin/profile", icon: User, role: "admin" },
    ],
    warden: [
        { title: "Dashboard", url: "/warden", icon: LayoutDashboard, role: "warden" },
        { title: "My Hostel", url: "/warden/hostels", icon: Building2, role: "warden" },
        { title: "Rooms", url: "/warden/rooms", icon: Bed, role: "warden" },
        { title: "Bookings", url: "/warden/bookings", icon: Calendar, role: "warden" },
        { title: "Payments", url: "/warden/payments", icon: CreditCard, role: "warden" },
        { title: "Residents", url: "/warden/residents", icon: Users, role: "warden" },
        { title: "Staff Tasks", url: "/warden/tasks", icon: ClipboardList, role: "warden" },
        { title: "Complaints", url: "/warden/complaints", icon: MessageSquare, role: "warden" },
        { title: "My Profile", url: "/warden/profile", icon: User, role: "warden" },
    ],
    guest: [
        { title: "Dashboard", url: "/guest/dashboard", icon: LayoutDashboard, role: "guest" },
        { title: "My Bookings", url: "/guest/bookings", icon: Calendar, role: "guest" },
        { title: "Payments", url: "/guest/payments", icon: CreditCard, role: "guest" },
        { title: "Services & Support", url: "/guest/support", icon: LifeBuoy, role: "guest" },
        { title: "Profile", url: "/guest/profile", icon: User, role: "guest" },
    ],
    staff: [
        { title: "Dashboard", url: "/staff/dashboard", icon: LayoutDashboard, role: "staff" },
        { title: "Assigned Tasks", url: "/staff/tasks", icon: ClipboardList, role: "staff" },
        { title: "Salary Records", url: "/staff/salary", icon: DollarSign, role: "staff" },
        { title: "Payments", url: "/staff/payments", icon: CreditCard, role: "staff" },
        { title: "My Profile", url: "/staff/profile", icon: User, role: "staff" },
    ],
}

const roleConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    admin: { label: "Admin", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-600" },
    warden: { label: "Warden", color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
    guest: { label: "Guest", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
    staff: { label: "Staff", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
}

function getCurrentRole(pathname: string): "admin" | "warden" | "guest" | "staff" {
    if (pathname.includes("/admin")) return "admin"
    if (pathname.includes("/warden")) return "warden"
    if (pathname.includes("/staff")) return "staff"
    if (pathname.includes("/guest")) return "guest"
    return "guest"
}

export function AppSidebar() {
    const pathname = usePathname()
    const currentRole = getCurrentRole(pathname)
    const logout = useAuthStore((state) => state.logout)
    const rc = roleConfig[currentRole]
    const navItems = items[currentRole]

    return (
        <Sidebar>
            {/* ── Header ── */}
            <SidebarHeader className="p-0 border-b-0">
                <div className="px-5 pt-5 pb-4">
                    {/* Brand */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                            <Building2 className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-gray-900 leading-none">GreenView</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-none">Hostel Management</p>
                        </div>
                    </div>

                    {/* Role badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${rc.bg}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${rc.dot} flex-shrink-0`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${rc.color}`}>
                            {rc.label} Dashboard
                        </span>
                    </div>
                </div>

                {/* Thin separator */}
                <div className="h-px bg-gray-100 mx-4" />
            </SidebarHeader>

            {/* ── Nav ── */}
            <SidebarContent className="px-3 py-3 overflow-y-auto">
                <nav className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.title}
                                href={item.url}
                                className={`
                                    group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }
                                `}
                            >
                                {/* Icon container */}
                                <div className={`
                                    h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150
                                    ${isActive
                                        ? "bg-white/20"
                                        : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                                    }
                                `}>
                                    <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                                </div>

                                <span className="flex-1 truncate">{item.title}</span>

                                {/* Active indicator chevron */}
                                {isActive && (
                                    <ChevronRight className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />
                                )}

                                {/* Badge */}
                                {item.badge && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </SidebarContent>

            {/* ── Footer ── */}
            <SidebarFooter className="p-0">
                <div className="h-px bg-gray-100 mx-4" />
                <div className="px-3 py-3">
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150 group cursor-pointer"
                    >
                        <div className="h-7 w-7 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-all duration-150">
                            <LogOut className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <span>Log Out</span>
                    </button>

                    <p className="text-[10px] text-gray-300 text-center mt-2 px-2">
                        ⌘B to collapse sidebar
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}
