"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutSuperAdmin } from "../actions/adminAuth";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  UserCircle,
  KeyRound,
  Database,
  MessageSquare,
  Settings,
  Shield,
  ScrollText,
  Building2,
  LogOut,
  ChevronRight,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", label: "Bot Users", icon: Users },
      { href: "/admin/tenants", label: "Tenants", icon: Building2 },
      { href: "/admin/tokens", label: "Invite Tokens", icon: KeyRound },
    ],
  },
  {
    label: "Data & Content",
    items: [
      { href: "/admin/knowledge", label: "Knowledge Base", icon: Database },
      { href: "/admin/analytics", label: "Chat Analytics", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
    ],
  },
];

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Don't render the admin layout on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Build breadcrumbs from pathname
  const breadcrumbs = buildBreadcrumbs(pathname);

  return (
    <div className="flex h-screen bg-zinc-950 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight uppercase">
              Super Admin
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    currentPath={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-800 shrink-0">
          <form action={logoutSuperAdmin}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium py-2.5 px-4 rounded-lg transition-all text-sm"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 text-zinc-500 hover:text-white md:hidden transition-colors"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && (
                    <ChevronRight size={12} className="text-zinc-600" />
                  )}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-white font-medium">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Right side: Status indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-medium hidden sm:inline">
                System Online
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── NavItem Component ───────────────────────────────────────────
function NavItem({ href, label, icon: Icon, currentPath }) {
  const isActive =
    href === "/admin"
      ? currentPath === "/admin"
      : currentPath.startsWith(href);

  return (
    <Link href={href}>
      <span
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
          isActive
            ? "bg-white text-zinc-900 shadow-lg shadow-white/5"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
        }`}
      >
        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
        {label}
      </span>
    </Link>
  );
}

// ─── Breadcrumb Builder ──────────────────────────────────────────
function buildBreadcrumbs(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [];

  const labelMap = {
    admin: "Admin",
    users: "Bot Users",
    tenants: "Tenants",
    tokens: "Invite Tokens",
    knowledge: "Knowledge Base",
    analytics: "Chat Analytics",
    settings: "Settings",
    audit: "Audit Log",
  };

  let path = "";
  for (const segment of segments) {
    path += `/${segment}`;
    crumbs.push({
      label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: path,
    });
  }

  return crumbs;
}
