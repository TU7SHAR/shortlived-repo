"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Ensure this path is correct
import Sidebar from "../components/Sidebar"; // Ensure this path is correct
import Topbar from "../components/Topbar"; // Ensure this path is correct
import { SubscriptionProvider } from "../context/SubscriptionContext";

export default function DashboardLayout({ children }) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Define the verification logic
    const verifyDatabaseAccess = async () => {
      // 1. Check with Supabase Server
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      // 2. If user is gone from Supabase (DB wipe), kick immediately
      if (userError || !user) {
        console.warn("User record missing or unauthorized. Force-kicking...");
        await executeHardLogout();
        return;
      }

      // If valid, finish loading the dashboard
      setIsVerifying(false);
    };

    // Run once on load
    verifyDatabaseAccess();

    // 3. THE HEARTBEAT: Ping every 30 seconds to detect DB wipes
    const interval = setInterval(verifyDatabaseAccess, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Defined here so it can be called from the useEffect
  const executeHardLogout = async () => {
    // 1. Wipe Supabase session
    await supabase.auth.signOut();

    // 2. Wipe your custom cookie
    document.cookie =
      "sb-access-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    // 3. NUCLEAR REDIRECT: Forces full browser reload to wipe memory
    window.location.href = "/login";
  };

  // Show a loading screen while we verify the first time
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center text-sm text-grey-500 font-medium">
        Verifying secure access...
      </div>
    );
  }

  return (
    <SubscriptionProvider>
      <div className="relative min-h-screen text-baseText font-body">
        {/* Desktop Sidebar Wrapper */}
        <div className="hidden md:flex fixed inset-y-0 left-0 w-72 z-40 border-r border-grey-100 bg-white">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="relative h-full w-72">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area Wrapper */}
        <div className="flex-1 min-h-screen md:pl-72 flex flex-col bg-grey-50 relative min-w-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Content Container */}
          <div className="flex-1 w-full bg-grey-50 px-4 sm:px-6 md:px-8 pb-8 pt-6">
            {children}
          </div>
        </div>
      </div>
    </SubscriptionProvider>
  );
}
