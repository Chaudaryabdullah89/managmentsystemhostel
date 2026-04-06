"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Building2,
    LogOut,
    ChevronRight,
    Activity,
    LayoutDashboard,
    LayoutList,
    type LucideIcon,
} from "lucide-react"
import useAuthStore from "@/hooks/Authstate"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"

import { NAVIGATION_GROUPS, NAVIGATION_ITEMS, type NavGroup, type NavItem } from "@/lib/navigation"
import { useState, useEffect } from "react"

// ── Permission filter ──────────────────────────────────────────────────────
function filterItem(item: NavItem, isAdmin: boolean, user: any): boolean {
    if (isAdmin) return true;
    const rolePerms = user?.rolePermissions || {};
    const sysSettings = user?.systemSettings || {};
    if (item.featureKey && sysSettings[item.featureKey] === false) return false;
    if (item.permissionKey && !rolePerms[item.permissionKey]) return false;
    return true;
}

function isItemActive(item: NavItem, pathname: string): boolean {
    if (item.url === "/warden") return pathname === item.url;
    if (pathname === item.url) return true;
    if (item.url === "/admin/hostels" && pathname.startsWith("/admin/hostels/rooms")) return false;
    return pathname.startsWith(item.url + "/");
}

// ══════════════════════════════════════════════════════════════════════════
// MODE A — Classic flat list (original style)
// ══════════════════════════════════════════════════════════════════════════
function ClassicNav({ items, pathname, isAdmin, user }: { items: NavItem[]; pathname: string; isAdmin: boolean; user: any }) {
    const visible = items.filter((i) => filterItem(i, isAdmin, user));
    return (
        <nav className="space-y-0.5">
            {visible.map((item) => {
                const isActive = isItemActive(item, pathname);
                const Icon = item.icon;
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
                        <div className={`
                            h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150
                            ${isActive ? "bg-white/20" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}
                        `}>
                            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                        </div>
                        <span className="flex-1 truncate">{item.title}</span>
                        {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/60 shrink-0" />}
                        {item.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                                {item.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// MODE B — Grouped collapsible nav
// ══════════════════════════════════════════════════════════════════════════
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.url}
            className={`
                flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-xl text-[12.5px] font-medium transition-all duration-150
                ${isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }
            `}
        >
            <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
            <span className="truncate">{item.title}</span>
            {item.badge && (
                <span className={`ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>
                    {item.badge}
                </span>
            )}
        </Link>
    );
}

function NavSection({ group, pathname, isAdmin, user, defaultOpen }: {
    group: NavGroup; pathname: string; isAdmin: boolean; user: any; defaultOpen: boolean;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const GroupIcon = group.icon;
    const visibleItems = group.items.filter((i) => filterItem(i, isAdmin, user));
    if (visibleItems.length === 0) return null;

    const hasActive = visibleItems.some((i) => isItemActive(i, pathname));

    useEffect(() => { if (hasActive) setOpen(true); }, [hasActive]);

    // Single-item group → inline link, no toggle
    if (visibleItems.length === 1) {
        const item = visibleItems[0];
        const active = isItemActive(item, pathname);
        const Icon = item.icon;
        return (
            <Link
                href={item.url}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                    ${active ? "bg-blue-600 text-white shadow-md shadow-blue-500/25" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
            >
                <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-white/20" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}`}>
                    <Icon className={`h-3.5 w-3.5 ${active ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                </div>
                <span className="flex-1 truncate">{item.title}</span>
                {active && <ChevronRight className="h-3 w-3 text-white/60 shrink-0" />}
            </Link>
        );
    }

    return (
        <div className="space-y-0.5">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer
                    ${hasActive ? "text-blue-600 bg-blue-50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"}`}
            >
                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${hasActive ? "bg-blue-100" : "bg-gray-100"}`}>
                    <GroupIcon className={`h-3 w-3 ${hasActive ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <span className="flex-1 text-left">{group.title}</span>
                <ChevronRight className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""} ${hasActive ? "text-blue-400" : "text-gray-300"}`} />
            </button>
            {open && (
                <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                        <NavLink key={item.url} item={item} isActive={isItemActive(item, pathname)} />
                    ))}
                </div>
            )}
        </div>
    );
}

function GroupedNav({ groups, pathname, isAdmin, user }: { groups: NavGroup[]; pathname: string; isAdmin: boolean; user: any }) {
    const isGroupActive = (g: NavGroup) => g.items.some((i) => isItemActive(i, pathname));
    return (
        <nav className="space-y-1">
            {groups.map((group) => (
                <NavSection
                    key={group.title}
                    group={group}
                    pathname={pathname}
                    isAdmin={isAdmin}
                    user={user}
                    defaultOpen={isGroupActive(group)}
                />
            ))}
        </nav>
    );
}

// ══════════════════════════════════════════════════════════════════════════
// Main AppSidebar
// ══════════════════════════════════════════════════════════════════════════
const NAV_MODE_KEY = "mgh_nav_mode";

export function AppSidebar() {
    const pathname = usePathname();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    const userRole = user?.role?.toLowerCase() || "guest";
    const isAdmin = user?.role === "ADMIN";

    // nav mode: "classic" | "grouped"
    const [navMode, setNavMode] = useState<"classic" | "grouped">("grouped");

    useEffect(() => {
        const stored = localStorage.getItem(NAV_MODE_KEY) as "classic" | "grouped" | null;
        if (stored) setNavMode(stored);
    }, []);

    function toggleMode() {
        const next = navMode === "grouped" ? "classic" : "grouped";
        setNavMode(next);
        localStorage.setItem(NAV_MODE_KEY, next);
    }

    const flatItems = (NAVIGATION_ITEMS[userRole] || NAVIGATION_ITEMS.guest);
    const groups    = (NAVIGATION_GROUPS[userRole] || NAVIGATION_GROUPS.guest);

    const roleDot: Record<string, string> = {
        admin: "bg-blue-600", warden: "bg-violet-600",
        guest: "bg-sky-500", resident: "bg-emerald-500", staff: "bg-amber-500",
    };

    return (
        <Sidebar>
            {/* ── Header ─────────────────────────────────────────────────── */}
            <SidebarHeader className="p-0 border-b-0">
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <Building2 className="text-white" style={{ height: 18, width: 18 }} />
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">
                            Mubarak Group of Hostels
                        </p>
                    </div>

                    {/* Role + nav mode toggle row */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50">
                            <div className={`h-1.5 w-1.5 rounded-full ${roleDot[userRole] ?? "bg-gray-400"} shrink-0 animate-pulse`} />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                {user?.role?.replace("_", " ") || "Authorized"} Access
                            </span>
                        </div>

                        {/* Toggle button */}
                        <button
                            onClick={toggleMode}
                            title={navMode === "grouped" ? "Switch to Classic view" : "Switch to Grouped view"}
                            className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-colors shrink-0 border border-gray-100 cursor-pointer"
                        >
                            {navMode === "grouped"
                                ? <LayoutList className="h-3.5 w-3.5" />
                                : <LayoutDashboard className="h-3.5 w-3.5" />
                            }
                        </button>
                    </div>

                    {/* Mode label */}
                    <p className="text-[9px] text-gray-300 uppercase tracking-widest text-right mt-1 pr-1">
                        {navMode === "grouped" ? "Grouped view" : "Classic view"}
                    </p>
                </div>
                <div className="h-px bg-gray-100 mx-4" />
            </SidebarHeader>

            {/* ── Content ────────────────────────────────────────────────── */}
            <SidebarContent className="px-3 py-3 overflow-y-auto">
                {navMode === "classic" ? (
                    <ClassicNav items={flatItems} pathname={pathname} isAdmin={isAdmin} user={user} />
                ) : (
                    <GroupedNav groups={groups} pathname={pathname} isAdmin={isAdmin} user={user} />
                )}
            </SidebarContent>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <SidebarFooter className="p-0">
                <div className="h-px bg-gray-100 mx-4" />
                <div className="px-3 py-3 space-y-0.5">
                    {/* System Health — admin only */}
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
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${pathname === "/admin/system-health" ? "bg-white/20" : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"}`}>
                                <Activity className={`h-3.5 w-3.5 ${pathname === "/admin/system-health" ? "text-white" : "text-gray-500 group-hover:text-blue-600"}`} />
                            </div>
                            <span className="flex-1 truncate">System Health</span>
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        </Link>
                    )}

                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all duration-150 group cursor-pointer"
                    >
                        <div className="h-7 w-7 rounded-lg bg-gray-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-all duration-150">
                            <LogOut className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </div>
                        <span>Log Out</span>
                    </button>

                    <p className="text-[10px] text-gray-300 text-center mt-1 px-2">
                        ⌘B to collapse sidebar
                    </p>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
