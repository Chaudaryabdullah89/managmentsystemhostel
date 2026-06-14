import React from 'react';
import { getSystemSettings } from '@/lib/permissions';
import { checkRole } from '@/lib/checkRole';
import { headers } from 'next/headers';
import { Wrench } from 'lucide-react';

export default async function MaintenanceWrapper({ children }) {
  const settings = await getSystemSettings();
  
  // Quick exit if maintenance is not active
  if (!settings.maintenanceMode) {
    return <>{children}</>;
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

  // Check if we are on an authentication page (allow access so admins/users can access auth forms)
  const headersList = await headers();
  const currentPath = headersList.get('x-pathname') || headersList.get('x-invoke-path') || headersList.get('referer') || "";
  if (currentPath.includes("/auth") || currentPath.includes("/auth/")) {
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
