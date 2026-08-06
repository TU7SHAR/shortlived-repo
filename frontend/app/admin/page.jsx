export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import {
  Users,
  KeyRound,
  Database,
  MessageSquare,
  TrendingUp,
  Activity,
  Building2,
  Clock,
} from "lucide-react";

export default async function AdminDashboard() {
  // Fetch all stats in parallel
  const [
    { count: totalUsers },
    { count: totalBannedUsers },
    { data: tokensData },
    { count: totalFiles },
    { count: totalChats },
    { data: recentUsers },
    { data: recentChats },
    { data: settingsData },
    { data: auditLogs },
  ] = await Promise.all([
    supabaseAdmin
      .from("authorized_users")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("authorized_users")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true),
    supabaseAdmin.from("invite_tokens").select("id, is_used, is_revoked, admin_id, created_at"),
    supabaseAdmin
      .from("ingested_files")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("chat_analytics")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("authorized_users")
      .select("telegram_id, username, created_at, is_banned")
      .order("created_at", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("chat_analytics")
      .select("id, telegram_id, user_query, mode, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabaseAdmin.from("bot_settings").select("admin_id, maintenance_mode"),
    supabaseAdmin
      .from("super_admin_audit_logs")
      .select("action, entity_type, performed_at")
      .order("performed_at", { ascending: false })
      .limit(5),
  ]);

  const totalTokens = tokensData?.length || 0;
  const usedTokens = tokensData?.filter((t) => t.is_used).length || 0;
  const revokedTokens = tokensData?.filter((t) => t.is_revoked).length || 0;
  const availableTokens = totalTokens - usedTokens - revokedTokens;

  // Tenant count (unique admin_ids from tokens)
  const uniqueAdmins = new Set(tokensData?.map((t) => t.admin_id).filter(Boolean));
  const totalTenants = uniqueAdmins.size;

  // Maintenance status
  const tenantsInMaintenance = settingsData?.filter((s) => s.maintenance_mode).length || 0;

  // Growth: users in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentGrowth = recentUsers?.filter(
    (u) => new Date(u.created_at) > sevenDaysAgo
  ).length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            System Overview
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Platform health, growth metrics, and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Clock size={14} className="text-zinc-500" />
          <span className="text-zinc-400 text-xs">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers || 0}
          subtitle={`${recentGrowth} this week`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Tenants"
          value={totalTenants}
          subtitle={`${tenantsInMaintenance} in maintenance`}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Knowledge Files"
          value={totalFiles || 0}
          subtitle="Across all tenants"
          icon={Database}
          color="emerald"
        />
        <StatCard
          title="Chat Messages"
          value={totalChats || 0}
          subtitle="Total interactions"
          icon={MessageSquare}
          color="amber"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MiniStat label="Available Tokens" value={availableTokens} />
        <MiniStat label="Used Tokens" value={usedTokens} />
        <MiniStat label="Revoked Tokens" value={revokedTokens} />
        <MiniStat label="Banned Users" value={totalBannedUsers || 0} accent="red" />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent Users */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Users</h3>
            <a
              href="/admin/users"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              View all &rarr;
            </a>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentUsers?.map((user) => (
              <div
                key={user.telegram_id}
                className="px-5 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Users size={12} className="text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {user.username || `ID: ${user.telegram_id}`}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    user.is_banned
                      ? "bg-red-500/10 text-red-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {user.is_banned ? "Banned" : "Active"}
                </span>
              </div>
            ))}
            {(!recentUsers || recentUsers.length === 0) && (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                No users yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Recent Chat Activity</h3>
            <a
              href="/admin/analytics"
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              View all &rarr;
            </a>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {recentChats?.map((chat) => (
              <div
                key={chat.id}
                className="px-5 py-3 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500 font-mono">
                    User {chat.telegram_id}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(chat.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 truncate">
                  {chat.user_query || "—"}
                </p>
                {chat.mode && (
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1 inline-block">
                    {chat.mode} mode
                  </span>
                )}
              </div>
            ))}
            {(!recentChats || recentChats.length === 0) && (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                No chat activity yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Preview */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Activity size={14} className="text-zinc-500" />
            Recent Admin Actions
          </h3>
          <a
            href="/admin/audit"
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Full log &rarr;
          </a>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {auditLogs?.map((log, i) => (
            <div
              key={i}
              className="px-5 py-3 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-zinc-300 font-medium">
                  {formatAction(log.action)}
                </span>
                <span className="text-xs text-zinc-600">
                  on {log.entity_type}
                </span>
              </div>
              <span className="text-xs text-zinc-600">
                {timeAgo(log.performed_at)}
              </span>
            </div>
          ))}
          {(!auditLogs || auditLogs.length === 0) && (
            <div className="px-5 py-6 text-center text-zinc-600 text-sm">
              No admin actions recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorMap[color]}`}
        >
          <Icon size={16} />
        </div>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      <p className="text-xs text-zinc-500 mt-1 font-medium">{title}</p>
      {subtitle && (
        <p className="text-[11px] text-zinc-600 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg px-4 py-3 flex items-center justify-between">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <span
        className={`text-sm font-bold ${
          accent === "red" ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatAction(action) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
