"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Ban,
  ShieldCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  X,
} from "lucide-react";
import { banUser, unbanUser, deleteUser } from "../../actions/adminAuth";

export default function UsersTable({
  initialUsers,
  totalCount,
  currentPage,
  perPage,
  currentFilter,
  currentSearch,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const totalPages = Math.ceil(totalCount / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentFilter !== "all") params.set("filter", currentFilter);
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleFilter = (filter) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter !== "all") params.set("filter", filter);
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handlePage = (page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentFilter !== "all") params.set("filter", currentFilter);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleBan = async (telegramId) => {
    setActionLoading(telegramId);
    const result = await banUser(telegramId);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleUnban = async (telegramId) => {
    setActionLoading(telegramId);
    const result = await unbanUser(telegramId);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleDelete = async (telegramId) => {
    if (!confirm(`Permanently delete user ${telegramId}? This cannot be undone.`)) return;
    setActionLoading(telegramId);
    const result = await deleteUser(telegramId);
    if (result.success) {
      setSelectedUser(null);
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
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
            placeholder="Search by Telegram ID or username..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </form>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {["all", "active", "banned"].map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                currentFilter === f
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Telegram ID
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {initialUsers?.map((user) => (
                  <tr
                    key={user.telegram_id}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                          <UserCircle size={16} className="text-zinc-500" />
                        </div>
                        <span className="text-sm text-white font-medium truncate max-w-[150px]">
                          {user.onboarding?.full_name || user.username || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-zinc-400 font-mono">
                        {user.telegram_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-zinc-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.is_banned
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {user.is_banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.is_banned ? (
                          <button
                            onClick={() => handleUnban(user.telegram_id)}
                            disabled={actionLoading === user.telegram_id}
                            className="p-1.5 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            title="Unban user"
                          >
                            <ShieldCheck size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBan(user.telegram_id)}
                            disabled={actionLoading === user.telegram_id}
                            className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                            title="Ban user"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.telegram_id)}
                          disabled={actionLoading === user.telegram_id}
                          className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!initialUsers || initialUsers.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-zinc-600 text-sm">No users found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-zinc-400 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedUser(null)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            {/* Close */}
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* User Info */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                <UserCircle size={28} className="text-zinc-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedUser.onboarding?.full_name ||
                    selectedUser.username ||
                    "Unknown User"}
                </h3>
                <p className="text-sm text-zinc-500 font-mono">
                  ID: {selectedUser.telegram_id}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <DetailRow label="Status" value={selectedUser.is_banned ? "Banned" : "Active"} />
              <DetailRow label="Username" value={selectedUser.username || "—"} />
              <DetailRow
                label="Joined"
                value={new Date(selectedUser.created_at).toLocaleString()}
              />
              <DetailRow label="Admin ID" value={selectedUser.admin_id || "—"} />
              {selectedUser.onboarding && (
                <>
                  <div className="border-t border-zinc-800 my-3" />
                  <DetailRow label="Phone" value={selectedUser.onboarding.phone_number || "—"} />
                  <DetailRow label="Role" value={selectedUser.onboarding.role || "—"} />
                  <DetailRow
                    label="Experience"
                    value={selectedUser.onboarding.experience_level || "—"}
                  />
                  <DetailRow label="Goal" value={selectedUser.onboarding.goal || "—"} />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {selectedUser.is_banned ? (
                <button
                  onClick={() => handleUnban(selectedUser.telegram_id)}
                  disabled={actionLoading === selectedUser.telegram_id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  <ShieldCheck size={14} />
                  Unban User
                </button>
              ) : (
                <button
                  onClick={() => handleBan(selectedUser.telegram_id)}
                  disabled={actionLoading === selectedUser.telegram_id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  <Ban size={14} />
                  Ban User
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedUser.telegram_id)}
                disabled={actionLoading === selectedUser.telegram_id}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <span className="text-sm text-zinc-300 text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}
