"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    document.title = `Account | ${siteConfig.name}`;
    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error("Failed to retrieve user node:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/auth");
    } catch (err) {
      console.error("Sign out execution failed:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Loading profile configuration...
      </div>
    );
  }

  const email = user?.email || "No email available";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-6 md:p-8 w-full max-w-3xl space-y-8">
      {/* Header Layout - Styled to match the mentor's .section-header and .f-icon */}
      <div className="flex items-start gap-5">
        <div className="w-[48px] h-[48px] rounded-[13px] bg-primary-light flex items-center justify-center shrink-0">
          <User size={24} className="text-primary" />
        </div>
        <div>
          <h1 className="text-[1.25rem] md:text-[1.5rem] font-bold text-navy font-display tracking-tight leading-none mb-2.5">
            Account Profile
          </h1>
          <p className="text-[1.05rem] text-grey-500 font-light">
            View your basic registration records and authentication details
            below.
          </p>
        </div>
      </div>

      {/* Main Core Detail Card - Styled like a premium feature card */}
      <div className="bg-white rounded-[16px] border border-grey-100 p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Profile Info */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            {/* FIXED: Added min-w-16 and min-h-16 to prevent flexbox from squishing the avatar */}
            <div className="w-16 h-16 min-w-[64px] min-h-[64px] rounded-[14px] bg-primary text-white flex items-center justify-center font-display font-bold text-2xl shadow-[0_4px_16px_rgba(29,78,216,0.30)] shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="text-[1.3rem] font-bold text-navy font-display truncate uppercase tracking-wide leading-tight">
                {displayName}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <Mail size={16} className="text-primary/60 shrink-0" />
                <p className="text-[0.95rem] text-grey-500 truncate font-medium">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* Action Tray - Styled like a secondary outline button */}
          <div className="w-full md:w-auto pt-6 md:pt-0 border-t border-grey-100 md:border-none">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 bg-white border-2 border-grey-100 text-grey-700 font-bold px-6 py-3 rounded-[11px] hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <LogOut size={18} />
              )}
              <span>{isSigningOut ? "Signing Out..." : "Sign Out"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
