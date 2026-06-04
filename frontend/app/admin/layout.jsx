"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutSuperAdmin } from "../actions/adminAuth";
import { Menu, X } from "lucide-react";

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Automatically close the mobile menu when the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-zinc-50 font-sans overflow-hidden">
      {/* --- Mobile Overlay --- */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- Sidebar --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 shrink-0">
          <h1 className="text-xl font-bold text-black tracking-tight">
            Super Admin
          </h1>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-zinc-500 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <NavItem
            href="/admin"
            label="Overview Dashboard"
            currentPath={pathname}
          />

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Management
            </p>
          </div>
          <NavItem
            href="/admin/users"
            label="Authorized Users"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/leads"
            label="Onboarding Leads"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/invites"
            label="Invite Tokens"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/settings"
            label="Bot Settings"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/api-usage"
            label="Api Usage"
            currentPath={pathname}
          />

          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Data & Activity
            </p>
          </div>
          <NavItem
            href="/admin/analytics"
            label="Chat Analytics"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/knowledge"
            label="Ingested Files"
            currentPath={pathname}
          />
          <NavItem
            href="/admin/scores"
            label="Quiz & Test Results"
            currentPath={pathname}
          />
        </nav>

        <div className="p-4 border-t border-zinc-200 shrink-0">
          <form action={logoutSuperAdmin}>
            <button
              type="submit"
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-black font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm flex justify-center"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header bar (Only visible on small screens) */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-4 shrink-0 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-600 hover:text-black focus:outline-none"
          >
            <Menu size={24} />
          </button>
          <span className="ml-2 font-bold text-lg tracking-tight">
            Super Admin
          </span>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

// --- NavItem Component ---
function NavItem({ href, label, currentPath }) {
  // Logic to determine if the link is active.
  // It handles exact matches for "/admin" and partial matches for sub-routes like "/admin/users"
  const isActive =
    href === "/admin" ? currentPath === "/admin" : currentPath.startsWith(href);

  return (
    <Link href={href}>
      <span
        className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-black text-white shadow-md" // Active Style
            : "text-zinc-600 hover:bg-zinc-100 hover:text-black" // Inactive Style
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
