import React from 'react';
import { getSystemSettings } from '@/lib/permissions';
import { checkRole } from '@/lib/checkRole';
import { headers, cookies } from 'next/headers';
import { Wrench } from 'lucide-react';

export default async function MaintenanceWrapper({ children }) {
  const settings = await getSystemSettings();
  
  // Quick exit if maintenance is not active
  if (!settings.maintenanceMode) {
    return <>{children}</>;
  }

  // Allow users with a valid bypass token cookie to access the system
  const cookieStore = await cookies();
  const bypassCookie = cookieStore.get('bypass_maintenance')?.value;
  if (bypassCookie && settings) {
    if (bypassCookie === settings.maintenanceWardenToken || bypassCookie === settings.maintenanceGuestToken) {
      return (
        <>
          <div className="bg-amber-600 text-white text-[10px] font-black text-center py-1 z-50 relative uppercase tracking-widest">
            ⚠️ Bypassing Maintenance Mode (Bypass Link Session Active)
          </div>
          {children}
        </>
      );
    }
  }

  // Allow admins to bypass maintenance mode
  const auth = await checkRole(["ADMIN"]);
  if (auth.success) {
    return (
      <>
        {/* Banner for Admins */}
        <div className="bg-red-600 text-white text-xs font-bold text-center py-1 z-50 relative">
          SYSTEM IS CURRENTLY IN MAINTENANCE MODE (Admins only bypass active)
        </div>
        {children}
      </>
    );
  }

  // Allow authentication routes and trampoline redirects to load
  const headersList = await headers();
  const currentPath = headersList.get('x-pathname') || "";
  if (currentPath.startsWith("/auth") || currentPath === "/redirecting") {
     return <>{children}</>;
  }

  // If maintenance is on and user is not admin, show maintenance screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <Wrench className="w-10 h-10 text-orange-600" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">We'll be back shortly</h1>
      <p className="text-gray-500 max-w-md mx-auto text-sm">
        {settings.maintenanceMessage || "Our systems are currently undergoing scheduled maintenance to improve your experience. Thank you for your patience."}
      </p>
    </div>
  );
}
