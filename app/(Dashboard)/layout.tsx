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

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-col flex-1 min-h-screen">
          <header className="flex h-16  items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="flex items-center justify-between w-full">
              <div></div>

              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage />
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-left">
                  <p className="font-medium">{user?.name || "Loading..."}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || "Guest"}</p>
                </div>
              </div>
            </div>
          </header>
          <div className="p-4  " >

            {children}
          </div>
          <Footer />
        </main>
      </SidebarProvider>
    </>
  )
}