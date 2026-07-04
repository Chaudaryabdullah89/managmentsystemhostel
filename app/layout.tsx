
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

import { prisma } from "@/lib/prisma"

export async function generateMetadata() {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "global" },
      select: {
        companyName: true,
        companyFavicon: true,
      }
    });

    const title = settings?.companyName || "Hostel Management";
    const icon = settings?.companyFavicon || "/favicon.ico";

    return {
      title,
      description: "Hostel Management System",
      icons: {
        icon,
        shortcut: icon,
        apple: icon,
      }
    };
  } catch (e) {
    return {
      title: "Hostel Management",
      description: "Hostel Management System",
      icons: {
        icon: "/favicon.ico",
      }
    };
  }
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