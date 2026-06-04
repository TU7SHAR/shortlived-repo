"use client";

import { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Menu,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import gsap from "gsap";
import Link from "next/link";
import { siteConfig } from "@/app/utils/config";
import { useRouter } from "next/navigation";

export default function ProfileHeader({ onMenuClick }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      // Clear ALL cookies comprehensively
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
      });

      // Clear local storage
      localStorage.clear();

      // Force hard redirect (full page reload)
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect on error
      window.location.replace("/login");
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" },
      );
    }
  };

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative flex items-center justify-between md:justify-end w-full py-4 px-4 md:px-8 border-b border-grey-100 bg-white">
      {/* Mobile Menu Trigger & Branding */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onMenuClick}
          className="p-2 text-grey-500 hover:text-primary transition-colors focus:outline-none"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold font-display text-navy text-lg">
          {siteConfig.name}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          {/* Ultra-clean profile button matching the mentor's nav links */}
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-3 py-1.5 focus:outline-none group"
          >
            <span className="text-[0.92rem] font-semibold text-navy hidden sm:block transition-colors group-hover:text-primary">
              {displayName}
            </span>

            <ChevronDown
              size={16}
              className={`text-grey-500 transition-transform hidden sm:block group-hover:text-primary ${isOpen ? "rotate-180" : ""}`}
            />

            {/* Avatar styled EXACTLY like the mentor's primary buttons/icons */}
            <div className="w-9 h-9 rounded-[9px] bg-primary text-white flex items-center justify-center font-display font-bold text-sm shadow-[0_2px_8px_rgba(29,78,216,0.25)] transition-transform group-hover:-translate-y-[1px]">
              {initial}
            </div>
          </button>

          {/* Dropdown styled with mentor's --shadow-lg and --radius */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-0 mt-4 left-2 sm:left-auto w-[calc(100vw-2rem)] sm:w-64 max-w-[16rem] bg-white border border-grey-100 rounded-[12px] shadow-[0_16px_48px_rgba(10,22,40,0.16)] z-50 overflow-hidden"
            >
              <div className="px-4 py-4 border-b border-grey-100 bg-grey-50">
                <p className="text-[0.95rem] font-bold text-navy font-display truncate">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-grey-500">
                  <ShieldCheck size={14} className="text-accent" />
                  <span className="text-xs font-medium">Verified Admin</span>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[0.92rem] text-grey-700 font-medium hover:text-primary hover:bg-primary-light rounded-[8px] transition-colors"
                >
                  <User size={16} />
                  Account Settings
                </Link>
                <Link
                  href="/billing"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[0.92rem] text-grey-700 font-medium hover:text-primary hover:bg-primary-light rounded-[8px] transition-colors"
                >
                  <CreditCard size={16} />
                  Billing & Usage
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[0.92rem] text-grey-700 font-medium hover:text-primary hover:bg-primary-light rounded-[8px] transition-colors"
                >
                  <Settings size={16} />
                  Bot Preferences
                </Link>
              </div>
              <div className="p-2 border-t border-grey-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[0.92rem] text-red-600 font-semibold hover:bg-red-50 rounded-[8px] transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
