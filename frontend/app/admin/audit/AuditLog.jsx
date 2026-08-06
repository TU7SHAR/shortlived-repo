"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Shield,
  Ban,
  Trash2,
  KeyRound,
  Database,
  Power,
  LogIn,
  LogOut,
  Settings,
  Download,
} from "lucide-react";

const ACTION_ICONS = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  BAN_USER: Ban,
  UNBAN_USER: Shield,
  DELETE_USER: Trash2,
  REVOKE_TOKEN: Ban,
  BULK_REVOKE_TOKENS: Ban,
  DELETE_TOKEN: Trash2,
  DELETE_FILE: Trash2,
  BULK_DELETE_FILES: Trash2,
  ENABLE_MAINTENANCE: Power,
  DISABLE_MAINTENANCE: Power,
  GLOBAL_MAINTENANCE_ON: Power,
  GLOBAL_MAINTENANCE_OFF: Power,
  UPDATE_SETTINGS: Settings,
  DELETE_CHAT_LOGS: Trash2,
  PURGE_ANALYTICS: Trash2,
};

const ACTION_COLORS = {
  LOGIN: "text-blue-400 bg-blue-500/10",
  LOGOUT: "text-zinc-400 bg-zinc-500/10",
  BAN_USER: "text-red-400 bg-red-500/10",
  UNBAN_USER: "text-emerald-400 bg-emerald-500/10",
  DELETE_USER: "text-red-400 bg-red-500/10",
  REVOKE_TOKEN: "text-amber-400 bg-amber-500/10",
  BULK_REVOKE_TOKENS: "text-amber-400 bg-amber-500/10",
  DELETE_TOKEN: "text-red-400 bg-red-500/10",
  DELETE_FILE: "text-red-400 bg-red-500/10",
  BULK_DELETE_FILES: "text-red-400 bg-red-500/10",
  ENABLE_MAINTENANCE: "text-amber-400 bg-amber-500/10",
  DISABLE_MAINTENANCE: "text-emerald-400 bg-emerald-500/10",
  GLOBAL_MAINTENANCE_ON: "text-red-400 bg-red-500/10",
  GLOBAL_MAINTENANCE_OFF: "text-emerald-400 bg-emerald-500/10",
  UPDATE_SETTINGS: "text-blue-400 bg-blue-500/10",
  DELETE_CHAT_LOGS: "text-red-400 bg-red-500/10",
  PURGE_ANALYTICS: "text-red-400 bg-red-500/10",
};

export default function AuditLog({
  logs,
  totalCount,
  currentPage,
  perPage,
  currentSearch,
  currentAction,
  actionTypes,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);

  const totalPages = Math.ceil(totalCount / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentAction && currentAction !== "all") params.set("action", currentAction);
    startTransition(() => {
      router.push(`/admin/audit?${params.toString()}`);
    });
  };

  const handleActionFilter = (action) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (action !== "all") params.set("action", action);
    startTransition(() => {
      router.push(`/admin/audit?${params.toString()}`);
    });
  };

  const handlePage = (page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentAction && currentAction !== "all") params.set("action", currentAction);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/admin/audit?${params.toString()}`);
    });
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["ID", "Action", "Entity Type", "Entity ID", "Metadata", "Performed At"].join(","),
      ...logs.map((log) =>
        [
          log.id,
          log.action,
          log.entity_type,
          log.entity_id || "",
          `"${JSON.stringify(log.metadata || {}).replace(/"/g, '""')}"`,
          log.performed_at,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, entity, or ID..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={currentAction || "all"}
            onChange={(e) => handleActionFilter(e.target.value)}
            className="px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer"
          >
            <option value="all">All Actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            title="Export as CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="space-y-1">
          {logs.map((log) => {
            const Icon = ACTION_ICONS[log.action] || ScrollText;
            const colorClass = ACTION_COLORS[log.action] || "text-zinc-400 bg-zinc-500/10";
            const metadata = log.metadata || {};

            return (
              <div
                key={log.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-800/30 transition-colors group"
              >
                {/* Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}
                >
                  <Icon size={14} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {formatAction(log.action)}
                    </span>
                    <span className="text-xs text-zinc-600">on</span>
                    <span className="text-xs text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                      {log.entity_type}
                    </span>
                    {log.entity_id && (
                      <span className="text-xs text-zinc-500 font-mono truncate max-w-[150px]">
                        #{log.entity_id}
                      </span>
                    )}
                  </div>
                  {/* Metadata preview */}
                  {Object.keys(metadata).length > 0 && (
                    <p className="text-[11px] text-zinc-600 mt-0.5 truncate max-w-[400px]">
                      {formatMetadata(metadata)}
                    </p>
                  )}
                </div>

                {/* Timestamp */}
                <div className="text-right shrink-0">
                  <p className="text-xs text-zinc-500">
                    {new Date(log.performed_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {new Date(log.performed_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <ScrollText size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">No audit events recorded yet.</p>
              <p className="text-zinc-700 text-xs mt-1">
                Actions will appear here as you use the admin panel.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs text-zinc-600">
              Showing {(currentPage - 1) * perPage + 1}–
              {Math.min(currentPage * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-zinc-400 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatAction(action) {
  return action
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetadata(metadata) {
  const parts = [];
  if (metadata.count) parts.push(`Count: ${metadata.count}`);
  if (metadata.telegram_id) parts.push(`TG: ${metadata.telegram_id}`);
  if (metadata.admin_id) parts.push(`Admin: ${metadata.admin_id.slice(0, 8)}...`);
  if (metadata.days_old) parts.push(`Days: ${metadata.days_old}`);
  if (metadata.records_deleted) parts.push(`Deleted: ${metadata.records_deleted}`);
  if (parts.length === 0) return JSON.stringify(metadata).slice(0, 80);
  return parts.join(" | ");
}
