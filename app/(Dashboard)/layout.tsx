"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appsidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Footer } from "@/components/Footer"
import { useEffect, useState } from "react"
import useAuthStore, { checkAuth } from "@/hooks/Authstate"
import { useBookings } from "@/hooks/useBooking"
import { AlertCircle, ShieldAlert, Home, LayoutList, LayoutDashboard } from "lucide-react"
import HeaderNotices from "@/components/Dashboard/HeaderNotices"
import AiAssistant from "@/components/Dashboard/AiAssistant"
import { usePathname } from "next/navigation"
import { NAVIGATION_ITEMS } from "@/lib/navigation"
import Link from "next/link"

// ── Nav mode toggle (syncs with sidebar via localStorage + custom event) ─────
function NavModeToggle() {
  const [mode, setMode] = useState<"grouped" | "classic">("grouped")
  useEffect(() => {
    const stored = localStorage.getItem("mgh_nav_mode") as "grouped" | "classic" | null
    if (stored) setMode(stored)
  }, [])
  function toggle() {
    const next = mode === "grouped" ? "classic" : "grouped"
    setMode(next)
    localStorage.setItem("mgh_nav_mode", next)
    window.dispatchEvent(new Event("mgh_nav_mode_change"))
  }
  return (
    <button
      onClick={toggle}
      title={mode === "grouped" ? "Switch to Classic nav" : "Switch to Grouped nav"}
      className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center text-gray-400 transition-colors border border-gray-200 cursor-pointer shrink-0"
    >
      {mode === "grouped"
        ? <LayoutList className="h-4 w-4" />
        : <LayoutDashboard className="h-4 w-4" />
      }
    </button>
  )
}

// ── PageContent: properly-named component so React hooks rules are followed ──
// This replaces the IIFE pattern that was previously used in RootLayout,
// which broke the Rules of Hooks by calling usePathname() inside a closure.
function PageContent({
  children,
  user,
  isAuthLoading,
}: {
  children: React.ReactNode
  user: any
  isAuthLoading: boolean
}) {
  const pathname = usePathname()
  const normalizedRole = (user?.role || "").toString().toUpperCase()
  const userRole = normalizedRole.toLowerCase() || "guest"
  const rolePerms = (user as any)?.rolePermissions || {}
  const sysSettings = (user as any)?.systemSettings || {}

  const allNavItems = Object.values(NAVIGATION_ITEMS).flat()
  const myItems = NAVIGATION_ITEMS[userRole] || NAVIGATION_ITEMS.guest

  // 1. Is this path protected by SOME role's navigation map?
  const isProtectedPath = allNavItems.some(
    (item) =>
      pathname === item.url ||
      (item.url !== "/" && pathname.startsWith(item.url + "/"))
  )

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
          Loading session...
        </p>
      </div>
    )
  }

  let isAuthorized = true
  if (isProtectedPath && normalizedRole !== "ADMIN") {
    // 2. Does this specific protected path belong to MY role's allowed map?
    const myMatch = myItems.find(
      (item) =>
        pathname === item.url ||
        (item.url !== "/" && pathname.startsWith(item.url + "/"))
    )

    if (!myMatch) {
      isAuthorized = false // Trying to access another role's area
    } else {
      // 3. Check if the specific feature/permission is toggled off
      if (myMatch.featureKey && sysSettings[myMatch.featureKey] === false)
        isAuthorized = false
      if (myMatch.permissionKey && !rolePerms[myMatch.permissionKey])
        isAuthorized = false
    }
  }

  if (!isAuthorized) {
    const homeUrl =
      normalizedRole === "ADMIN"
        ? "/admin/dashboard"
        : normalizedRole === "WARDEN"
        ? "/warden"
        : normalizedRole === "STAFF"
        ? "/staff/dashboard"
        : "/guest/dashboard"

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          Access Restricted
        </h2>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
          You don&apos;t have the required permissions to view this page, or this
          feature has been temporarily disabled by the administrator.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href={homeUrl}
            className="px-6 h-11 bg-gray-900 text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-black transition-colors"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// ── Root Dashboard Layout ─────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  const isAuthLoading = useAuthStore((state) => state.isLoading)
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const { data: bookings = [] } = useBookings({ userId: user?.id })
  const isGuest = (user?.role || "").toString().toUpperCase() === "GUEST"
  const isCheckedOut =
    isGuest &&
    bookings.length > 0 &&
    bookings.some((b: any) => b.status === "CHECKED_OUT") &&
    !bookings.some((b: any) =>
      ["CONFIRMED", "CHECKED_IN", "PENDING"].includes(b.status)
    )

  return (
    <>
      <SidebarProvider>
        <div className="print:hidden">
          <AppSidebar />
        </div>
        <main className="flex flex-col flex-1 min-w-0 min-h-screen">
          {isCheckedOut && (
            <div className="bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-full duration-700 z-60 sticky top-0 print:hidden">
              <AlertCircle className="h-3.5 w-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Portal Restricted &bull; Read-only mode active (Residency Concluded)
              </p>
            </div>
          )}
          <header
            className={`flex h-16 items-center gap-2 border-b px-4 shrink-0 bg-white print:hidden ${
              !isCheckedOut ? "sticky top-0 z-50" : ""
            }`}
          >
            <SidebarTrigger />
            <NavModeToggle />
            <div className="h-5 w-px bg-gray-200 mx-1" />
            <div className="flex items-center justify-between min-w-0 w-full">
              <div></div>

              <div className="flex items-center gap-4 min-w-0">
                {!(["ADMIN", "WARDEN"].includes((user?.role || "").toString().toUpperCase())) && <HeaderNotices />}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-10 w-10 rounded-xl border border-gray-200 shadow-sm">
                      <AvatarImage />
                      <AvatarFallback className="rounded-xl bg-linear-to-br from-indigo-500 to-blue-500 text-white font-semibold text-sm">
                        {user?.name ? user.name.trim().slice(0, 2).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>

                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                  </div>

                  {/* User Info */}
                  <div className="min-w-0 hidden md:block">
                    <p className="text-sm font-semibold text-gray-900 truncate tracking-tight">
                      {user?.name || "Loading..."}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.role || "Guest"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-2 md:p-4 flex-1 h-full w-full min-w-0 overflow-y-auto overflow-x-hidden">
            <PageContent user={user} isAuthLoading={isAuthLoading}>
              {children}
            </PageContent>
          </div>
          <div className="print:hidden">
            <Footer />
          </div>
        </main>
        {(["RESIDENT", "GUEST"].includes((user?.role || "").toString().toUpperCase())) && user?.systemSettings?.enableAiAssistant !== false && (
          <div className="print:hidden">
            <AiAssistant />
          </div>
        )}
      </SidebarProvider>
    </>
  )
}