"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
} from "lucide-react";

export default function AnalyticsTable({
  chats,
  totalCount,
  currentPage,
  perPage,
  currentSearch,
  currentMode,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [expandedChat, setExpandedChat] = useState(null);

  const totalPages = Math.ceil(totalCount / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentMode && currentMode !== "all") params.set("mode", currentMode);
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  const handleMode = (mode) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (mode !== "all") params.set("mode", mode);
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  const handlePage = (page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentMode && currentMode !== "all") params.set("mode", currentMode);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/admin/analytics?${params.toString()}`);
    });
  };

  const handleExportCSV = () => {
    const csvRows = [
      ["ID", "Telegram ID", "User Query", "Bot Response", "Mode", "Date"].join(","),
      ...chats.map((chat) =>
        [
          chat.id,
          chat.telegram_id,
          `"${(chat.user_query || "").replace(/"/g, '""')}"`,
          `"${(chat.bot_response || "").replace(/"/g, '""')}"`,
          chat.mode,
          chat.created_at,
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const modes = ["all", "normal", "training", "testing"];

  return (
    <div className="space-y-4">
      {/* Search, Filters, and Export */}
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
            placeholder="Search queries or responses..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => handleMode(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                  (currentMode || "all") === m
                    ? "bg-white text-zinc-900"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
            title="Export current page as CSV"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="space-y-2">
          {chats.map((chat) => {
            const isExpanded = expandedChat === chat.id;

            return (
              <div
                key={chat.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all"
              >
                {/* Collapsed row */}
                <div
                  className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => setExpandedChat(isExpanded ? null : chat.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <User size={12} className="text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate max-w-[400px]">
                        {chat.user_query || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-600 font-mono">
                          User {chat.telegram_id}
                        </span>
                        <span className="text-zinc-800">·</span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(chat.created_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        chat.mode === "training"
                          ? "bg-purple-500/10 text-purple-400"
                          : chat.mode === "testing"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      {chat.mode || "normal"}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-zinc-500" />
                    ) : (
                      <ChevronDown size={14} className="text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-4 border-t border-zinc-800 pt-4 space-y-3">
                    {/* User Query */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <User size={10} className="text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">
                          User Query
                        </p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
                          {chat.user_query || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Bot Response */}
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot size={10} className="text-emerald-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider mb-1">
                          Bot Response
                        </p>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                          {chat.bot_response || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 pt-2 border-t border-zinc-800/50">
                      <span className="text-[10px] text-zinc-600">
                        Admin: {chat.admin_id?.slice(0, 8)}...
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        ID: #{chat.id}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {chats.length === 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <MessageSquare size={24} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">No chat interactions found.</p>
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
