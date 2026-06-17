"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  Key,
  Shield,
  Loader2,
  LineChart,
  Activity,
  UserPlus,
  X,
  Fence,
  ScanEye,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "@/app/utils/config";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Token Management", href: "/invites", icon: Key },
  { name: "Knowledge Base", href: "/knowledge", icon: FileText },
  { name: "Onboarding Flow", href: "/onboarding", icon: UserPlus },
  { name: "Users Management", href: "/users", icon: Users },
  { name: "Training Modules", href: "/training", icon: Fence },
  { name: "Conversations", href: "/conversations", icon: ScanEye },
  { name: "Test Analytics", href: "/analytics", icon: LineChart },
  { name: "API Usage", href: "/api-usage", icon: Activity },
  { name: "Feedbacks", href: "/feedback", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Updated to match the bright WhatsApp green from the HTML template
const STATUS_MAP = {
  online: {
    color: "bg-[#25D366]",
    pulse: "bg-[#25D366]/50",
    text: "Bot Online",
  },
  maintenance: {
    color: "bg-amber-500",
    pulse: "bg-amber-400",
    text: "Maintenance",
  },
  halted: { color: "bg-red-500", pulse: "bg-red-400", text: "Bot Halted" },
};

function useBotStatus() {
  const [status, setStatus] = useState(STATUS_MAP.online);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user");

        const { data, error } = await supabase
          .from(DB.SETTINGS.TABLE)
          .select(DB.SETTINGS.MAINTENANCE_MODE)
          .eq(DB.SETTINGS.CREATED_BY, user.id)
          .maybeSingle();

        if (error) throw error;
        setStatus(
          data?.[DB.SETTINGS.MAINTENANCE_MODE]
            ? STATUS_MAP.maintenance
            : STATUS_MAP.online,
        );
      } catch {
        setStatus(STATUS_MAP.halted);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 120000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}

function SidebarHeader({ onClose }) {
  return (
    <div className="h-[68px] flex items-center justify-between px-6 border-b border-grey-100 shrink-0">
      <a
        href="/"
        className="flex items-center gap-2.5 text-navy font-display font-bold text-[1.4rem] tracking-tight no-underline"
      >
        <div className="w-[36px] h-[36px] bg-primary rounded-[9px] flex items-center justify-center relative overflow-hidden shrink-0">
          <div className="absolute w-[20px] h-[20px] border-[2.5px] border-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%]"></div>
          <div className="absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white bottom-[7px] left-1/2 -translate-x-1/2"></div>
        </div>
        <span>
          Sales<span className="text-primary-bright">ji</span>
        </span>
      </a>
      <button
        onClick={onClose}
        className="md:hidden p-2 text-grey-500 hover:text-primary transition-colors rounded-lg hover:bg-grey-50"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function NavLink({ item, isActive, onClose }) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[0.92rem] transition-colors duration-200 outline-none select-none ${
        isActive
          ? "bg-primary-light text-primary font-semibold"
          : "text-grey-700 hover:bg-primary-light hover:text-primary font-medium"
      }`}
    >
      <item.icon
        size={18}
        className={
          isActive
            ? "text-primary"
            : "text-grey-500 group-hover:text-primary transition-colors"
        }
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span>{item.name}</span>
    </Link>
  );
}

function StatusIndicator({ status, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-1">
        <Loader2 size={12} className="animate-spin text-grey-400" />
        <span className="text-xs font-medium text-grey-500">
          Syncing status...
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full bg-grey-50 rounded-[12px] border border-grey-100 px-3 py-3">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-2.5 w-2.5">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.pulse}`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${status.color}`}
          />
        </div>
        <span className="text-[0.8rem] font-semibold text-navy">
          {status.text}
        </span>
      </div>
      <span className="text-[10px] font-mono font-medium text-grey-500">
        v{siteConfig.version || "1.0.0"}
      </span>
    </div>
  );
}

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { status, loading } = useBotStatus();

  return (
    <div className="flex h-full w-full flex-col bg-white select-none">
      <SidebarHeader onClose={onClose} />

      <div className="px-5 pt-6 pb-2">
        <p className="text-[0.78rem] font-bold tracking-[0.1em] uppercase text-grey-500 mb-2 font-body">
          Main Menu
        </p>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-4 pb-4"
        role="navigation"
        aria-label="Main"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.name}
            item={item}
            isActive={
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            }
            onClose={onClose}
          />
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <StatusIndicator status={status} loading={loading} />
      </div>
    </div>
  );
}
