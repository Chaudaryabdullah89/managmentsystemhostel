
import type { Metadata } from "next"
import "./globals.css"
import "@/bones/registry"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"
import MaintenanceWrapper from "@/components/MaintenanceWrapper"

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
      <head>
      </head>
      <body>
        <ReactQueryProvider>
          <AuthProvider>

            <Toaster position="top-right" richColors />
            <Analytics />
            <MaintenanceWrapper>
              {children}
            </MaintenanceWrapper>
          </AuthProvider>
        </ReactQueryProvider>

      </body>
    </html>
  )
}