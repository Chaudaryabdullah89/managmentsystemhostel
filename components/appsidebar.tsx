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
    Activity,
    Users,
    LogOut,
    Search,
    ClipboardList,
    ChevronRight,
    Utensils,
    Megaphone,
    Wallet,
    Plane,
    BarChart3,
    ShieldCheck,
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
import { Button } from "@/components/ui/button"

import { NAVIGATION_ITEMS, type NavItem } from "@/lib/navigation"

const items = NAVIGATION_ITEMS

const roleConfig: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    admin: { label: "Admin", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-600" },
    warden: { label: "Warden", color: "text-violet-600", bg: "bg-violet-50", dot: "bg-violet-500" },
    guest: { label: "Guest", color: "text-sky-600", bg: "bg-sky-50", dot: "bg-sky-500" },
    resident: { label: "Resident", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
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
    const logout = useAuthStore((state) => state.logout)
    const user = useAuthStore((state) => state.user)

    // DECIDE NAV BASED ON REAL USER ROLE, NOT URL
    const userRole = user?.role?.toLowerCase() || 'guest'
    const isAdmin = user?.role === 'ADMIN'
    const rc = roleConfig[userRole] || roleConfig.guest

    // Dynamic Filtering Logic
    let navItems = (items[userRole] || items.guest).filter(item => {
        // Admins bypass all service/permission toggles for management
        if (isAdmin) return true;

        const rolePerms = (user as any)?.rolePermissions || {};
        const sysSettings = (user as any)?.systemSettings || {};

        // 1. Check Global Feature Flag (SystemSettings)
        if (item.featureKey && sysSettings[item.featureKey] === false) {
            return false;
        }

        // 2. Check Role-specific Permission (RolePermission)
        if (item.permissionKey && !rolePerms[item.permissionKey]) {
            return false;
        }

        return true;
    });

    return (
        <Sidebar>
            <SidebarHeader className="p-0 border-b-0">
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                            <Building2 className="h-4.5 w-4.5 text-white" style={{ height: 18, width: 18 }} />
                        </div>
                        <div>
                            {/* <h1 className="text-lg font-bold tracking-tight">MGH</h1> */}
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">
                                Mubarak Group of Hostels
                            </p>
                        </div>
                    </div>

                    {/* Role badge */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${user?.role === 'ADMIN' ? 'bg-blue-600' : user?.role === 'WARDEN' ? 'bg-violet-600' : 'bg-emerald-600'} shrink-0 animate-pulse`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider text-gray-500`}>
                            {user?.role?.replace('_', ' ') || 'Authorized'} Access
                        </span>
                    </div>
                </div>
                <div className="h-px bg-gray-100 mx-4" />
            </SidebarHeader>

            <SidebarContent className="px-3 py-3 overflow-y-auto">
                <nav className="space-y-0.5">
                    {navItems.map((item) => {
                        // Use exact match for root dashboard URLs to prevent them
                        // matching every nested page (e.g. /warden matching /warden/hostels)
                        const isDashboardItem = item.icon === LayoutDashboard || item.url === "/warden"

                        let isActive = false
                        if (isDashboardItem) {
                            isActive = pathname === item.url
                        } else {
                            // Exact match always wins
                            if (pathname === item.url) {
                                isActive = true
                            } else if (pathname.startsWith(item.url + "/")) {
                                // Special case for Admin: /admin/hostels vs /admin/hostels/rooms
                                // If we are in "All Hostels" (/admin/hostels), we don't want it active 
                                // if the current path is actually under "All Rooms" (/admin/hostels/rooms)
                                if (item.url === "/admin/hostels" && pathname.startsWith("/admin/hostels/rooms")) {
                                    isActive = false
                                } else {
                                    isActive = true
                                }
                            }
                        }
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
                <div className="px-3 py-3 space-y-0.5">
                    {/* System Health — admin only, pinned to footer */}
                    {isAdmin && (
                        <Link
                            href="/admin/system-health"
                            className={`
                                group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                                ${pathname === "/admin/system-health"
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }
                            `}
                        >
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150 ${pathname === "/admin/system-health" ? "bg-white/20" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}`}>
                                <Activity className={`h-3.5 w-3.5 ${pathname === "/admin/system-health" ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                            </div>
                            <span className="flex-1 truncate">System Health</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_2px_rgba(16,185,129,0.3)] flex-shrink-0" />
                        </Link>
                    )}
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
