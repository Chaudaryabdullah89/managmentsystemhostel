
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/appsidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Analytics } from "@vercel/analytics/next"
import { ReactQueryProvider } from "@/components/ReactQueryProvider"

export const metadata: Metadata = {
  title: "Hostel Management",
  description: "Hostel Management System",
}


export default function RootLayout({

  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ReactQueryProvider>
          <AuthProvider>

            <Toaster position="top-right" richColors />
            <Analytics />
            {children}
          </AuthProvider>
        </ReactQueryProvider>

      </body>
    </html>
  )
}