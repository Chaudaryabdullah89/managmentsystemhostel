"use client";
import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";
import { useBranding } from "@/hooks/useBranding";

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");
    const { companyName } = useBranding();

    return (
        <footer className="bg-white dark:bg-background mt-auto">
            <div className="px-6 py-8">

                {/* Bottom Bar */}
                <div className="border-t dark:border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">
                        &copy; {currentYear} {companyName}. All rights reserved.
                    </p>
                    <div className="flex flex-row gap-4 items-center text-sm text-gray-600 dark:text-muted-foreground">
                        <Link href="/privacy-policy" className="hover:text-gray-900 dark:hover:text-foreground transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-gray-900 dark:hover:text-foreground transition-colors">Terms of Service</Link>
                        {isAdmin && (
                            <Link
                                href="/admin/system-health"
                                className="flex items-center gap-1.5 text-gray-500 dark:text-muted-foreground hover:text-blue-600 transition-colors font-medium"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                System Health
                                <Activity className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
};
