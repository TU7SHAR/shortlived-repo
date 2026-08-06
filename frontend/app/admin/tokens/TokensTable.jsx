"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Ban,
  Trash2,
  CheckSquare,
  Square,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import { revokeToken, bulkRevokeTokens, deleteToken } from "../../actions/adminAuth";

export default function TokensTable({
  tokens,
  totalCount,
  currentPage,
  perPage,
  currentSearch,
  currentFilter,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [selected, setSelected] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [copied, setCopied] = useState(null);

  const totalPages = Math.ceil(totalCount / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentFilter !== "all") params.set("filter", currentFilter);
    startTransition(() => {
      router.push(`/admin/tokens?${params.toString()}`);
    });
  };

  const handleFilter = (filter) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter !== "all") params.set("filter", filter);
    startTransition(() => {
      router.push(`/admin/tokens?${params.toString()}`);
    });
  };

  const handlePage = (page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentFilter !== "all") params.set("filter", currentFilter);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/admin/tokens?${params.toString()}`);
    });
  };

  const handleRevoke = async (tokenId) => {
    setActionLoading(tokenId);
    const result = await revokeToken(tokenId);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleDelete = async (tokenId) => {
    if (!confirm("Permanently delete this token?")) return;
    setActionLoading(tokenId);
    const result = await deleteToken(tokenId);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleBulkRevoke = async () => {
    setShowBulkConfirm(false);
    setActionLoading("bulk");
    const result = await bulkRevokeTokens(selected);
    if (result.success) {
      setSelected([]);
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const toggleSelect = (tokenId) => {
    setSelected((prev) =>
      prev.includes(tokenId)
        ? prev.filter((id) => id !== tokenId)
        : [...prev, tokenId]
    );
  };

  const toggleSelectAll = () => {
    const revokable = tokens.filter((t) => !t.is_revoked && !t.is_used);
    if (selected.length === revokable.length) {
      setSelected([]);
    } else {
      setSelected(revokable.map((t) => t.id));
    }
  };

  const copyToken = (tokenStr) => {
    navigator.clipboard.writeText(tokenStr);
    setCopied(tokenStr);
    setTimeout(() => setCopied(null), 2000);
  };

  const getTokenStatus = (token) => {
    if (token.is_revoked) return { label: "Revoked", class: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (token.is_used) return { label: "Used", class: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" };
    return { label: "Active", class: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
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
            placeholder="Search by token, recipient, or caption..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </form>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {["all", "unused", "used", "revoked"].map((f) => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                currentFilter === f
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
          <span className="text-sm text-amber-400 font-medium">
            {selected.length} token{selected.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={actionLoading === "bulk"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50"
            >
              <Ban size={12} />
              Revoke Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      {selected.length > 0 ? (
                        <CheckSquare size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Sent To
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Used By
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tokens.map((token) => {
                  const status = getTokenStatus(token);
                  const canSelect = !token.is_revoked && !token.is_used;

                  return (
                    <tr
                      key={token.id}
                      className={`hover:bg-zinc-800/30 transition-colors ${
                        selected.includes(token.id) ? "bg-zinc-800/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        {canSelect ? (
                          <button
                            onClick={() => toggleSelect(token.id)}
                            className="text-zinc-500 hover:text-white transition-colors"
                          >
                            {selected.includes(token.id) ? (
                              <CheckSquare size={14} className="text-blue-400" />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>
                        ) : (
                          <span className="w-[14px] inline-block" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white font-mono truncate max-w-[120px] sm:max-w-[180px]">
                            {token.token_string}
                          </span>
                          <button
                            onClick={() => copyToken(token.token_string)}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0"
                          >
                            {copied === token.token_string ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-zinc-400 capitalize">
                          {token.token_type || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-zinc-500 truncate max-w-[120px] inline-block">
                          {token.sent_to || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-zinc-500 font-mono">
                          {token.used_by_telegram_id || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.class}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!token.is_revoked && !token.is_used && (
                            <button
                              onClick={() => handleRevoke(token.id)}
                              disabled={actionLoading === token.id}
                              className="p-1.5 rounded-md text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                              title="Revoke token"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(token.id)}
                            disabled={actionLoading === token.id}
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete token"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <KeyRound size={24} className="text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-600 text-sm">No tokens found.</p>
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

      {/* Bulk Revoke Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBulkConfirm(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Revocation</h3>
                <p className="text-sm text-zinc-500">Tokens will become unusable.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              You are about to revoke{" "}
              <span className="text-white font-semibold">{selected.length}</span>{" "}
              token{selected.length > 1 ? "s" : ""}. Users who haven&apos;t activated yet
              will lose access.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkRevoke}
                className="flex-1 py-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors"
              >
                Revoke All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
