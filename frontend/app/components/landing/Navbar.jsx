// frontend/app/components/landing/Navbar.jsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "../../utils/config";
import { Shield, Menu, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check active session on mount
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkUser();

    // Listen for authentication changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 w-full z-[100] px-4 py-4 md:px-6 md:py-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 md:px-8 md:py-4 rounded-full relative">
        <Link href="/" className="flex items-center gap-2 z-50">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-lg flex items-center justify-center text-black shrink-0">
            <Shield
              size={16}
              className="md:w-[18px] md:h-[18px]"
              fill="currentColor"
            />
          </div>
          <span className="text-lg md:text-xl font-black text-white tracking-tighter">
            {siteConfig.name}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "About", "Pricing", "Contact"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              className="text-sm font-bold text-zinc-400 hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-4 z-50">
          <Link
            href={user ? "/dashboard" : "/login"}
            className="hidden sm:flex bg-white text-black px-5 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold hover:bg-zinc-200 transition-transform active:scale-95"
          >
            {user ? "Dashboard" : "Login"}
          </Link>
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Open mobile menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[100%] left-4 right-4 mt-2 bg-zinc-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {["Features", "About", "Pricing", "Contact"].map((item) => (
            <Link
              key={item}
              href={`/${item.toLowerCase()}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-bold text-zinc-300 hover:text-white transition-colors px-4 py-2 hover:bg-white/5 rounded-xl"
            >
              {item}
            </Link>
          ))}
          <Link
            href={user ? "/dashboard" : "/login"}
            onClick={() => setIsMobileMenuOpen(false)}
            className="bg-white text-black px-6 py-3 rounded-xl text-center text-sm font-bold hover:bg-zinc-200 transition-colors mt-2"
          >
            {user ? "Dashboard" : "Login"}
          </Link>
        </div>
      )}
    </nav>
  );
}
