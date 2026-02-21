"use client"
import type { Metadata } from "next"
// import "../../../"
import { useContext } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appsidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"
import useAuthStore, { checkAuth } from "@/hooks/Authstate"
import { useBookings } from "@/hooks/useBooking"
import { AlertCircle } from "lucide-react"
import HeaderNotices from "@/components/Dashboard/HeaderNotices"


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  console.log(user)

  useEffect(() => {
    checkAuth();
  }, []);

  const { data: bookings = [] } = useBookings({ userId: user?.id });
  const isGuest = user?.role === "GUEST";
  const isCheckedOut = isGuest && bookings.length > 0 &&
    bookings.some((b: any) => b.status === 'CHECKED_OUT') &&
    !bookings.some((b: any) => ['CONFIRMED', 'CHECKED_IN', 'Active'].includes(b.status));

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col flex-1 min-w-0 min-h-screen">
          {isCheckedOut && (
            <div className="bg-rose-600 text-white py-2 px-4 flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-full duration-700 z-[60] sticky top-0">
              <AlertCircle className="h-3.5 w-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">
                Portal Restricted &bull; Read-only mode active (Residency Concluded)
              </p>
            </div>
          )}
          <header className={`flex h-16 items-center gap-2 border-b px-4 shrink-0 bg-white ${!isCheckedOut ? 'sticky top-0 z-50' : ''}`}>
            <SidebarTrigger />
            <div className="flex items-center justify-between min-w-0 w-full">
              <div></div>

              <div className="flex items-center gap-4 min-w-0">
                <HeaderNotices />
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8 rounded-lg shrink-0">
                    <AvatarImage />
                    <AvatarFallback className="rounded-lg">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-left min-w-0 hidden md:block">
                    <p className="font-medium truncate">{user?.name || "Loading..."}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.role || "Guest"}</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-2 md:p-4 flex-1 h-full w-full min-w-0 overflow-y-auto overflow-x-hidden" >

            {children}
          </div>
          <Footer />
        </main>
      </SidebarProvider>
    </>
  )
}