"use client";
import React from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { usePathname } from "next/navigation";

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    return (
        <footer className="bg-white mt-auto">
            <div className="px-6 py-8">

                {/* Bottom Bar */}
                <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-600">
                        &copy; {currentYear} Mubarak Group of Hostels. All rights reserved.
                    </p>
                    <div className="flex flex-row gap-4 items-center text-sm text-gray-600">
                        <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
                        {isAdmin && (
                            <Link
                                href="/admin/system-health"
                                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors font-medium"
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
