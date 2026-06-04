"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Copy,
  Check,
  Trash2,
  Loader2,
  Search,
  Filter,
  Ticket,
  CheckCircle2,
  Clock,
  Ban,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { applyFiltersAndSort } from "../../utils/sortUtils";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

// Just add this to the top of your other pages!
export const dynamic = "force-dynamic";

export default function InvitesTablePage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: DB.TOKENS.CREATED_AT,
    direction: "desc",
    filterKey: DB.TOKENS.IS_USED,
    filterValue: "All",
  });
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);
  const orderDropdownRef = useRef(null);

  useEffect(() => {
    document.title = `Invites | ${siteConfig.name}`;
    fetchTokens();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        orderDropdownRef.current &&
        !orderDropdownRef.current.contains(event.target)
      ) {
        setOrderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTokens = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from(DB.TOKENS.TABLE)
      .select("*")
      .eq(DB.TOKENS.CREATED_BY, user.id)
      .order(DB.TOKENS.CREATED_AT, { ascending: false });

    if (!error) setTokens(data);
    setLoading(false);
  };

  const deleteToken = async (id, tokenType) => {
    if (tokenType === "admin") {
      alert("Action Denied: Admin tokens cannot be deleted.");
      return;
    }

    if (!confirm("Are you sure you want to delete this token?")) return;
    const { error } = await supabase
      .from(DB.TOKENS.TABLE)
      .delete()
      .eq(DB.TOKENS.ID, id);

    if (!error) {
      setTokens(tokens.filter((t) => t[DB.TOKENS.ID] !== id));
    }
  };

  const copyToClipboard = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Compute stats dynamically from token status
  const stats = useMemo(() => {
    const total = tokens.length;
    const used = tokens.filter(
      (t) => t[DB.TOKENS.IS_USED] && !t[DB.TOKENS.IS_REVOKED],
    ).length;
    const revoked = tokens.filter((t) => t[DB.TOKENS.IS_REVOKED]).length;
    const unused = total - used - revoked;

    return { total, used, unused, revoked };
  }, [tokens]);

  const displayedTokens = useMemo(() => {
    let filtered = tokens;
    if (searchQuery) {
      filtered = filtered.filter(
        (t) =>
          (t[DB.TOKENS.CAPTION] &&
            t[DB.TOKENS.CAPTION]
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (t[DB.TOKENS.TOKEN_STRING] &&
            t[DB.TOKENS.TOKEN_STRING]
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (t[DB.TOKENS.USED_BY_USER] &&
            t[DB.TOKENS.USED_BY_USER]
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }
    return applyFiltersAndSort(filtered, sortConfig);
  }, [tokens, sortConfig, searchQuery]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-zinc-500 text-sm font-medium">
        <Loader2 className="animate-spin text-zinc-400 mr-2" size={16} />
        Compiling token analytics...
      </div>
    );
  }

  return (
    // FIX: Removed max-w-5xl, changed to w-full with perfectly symmetrical padding
    <div className="p-6 md:p-8 w-full space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Token Management
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Detailed view of all generated access keys and their usage data.
        </p>
      </div>

      {/* Summary Cards Grid — Fits cleanly from mobile to huge displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Ticket size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Total Invites
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Active / Used
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.used}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Available/Unused
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.unused}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Ban size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Revoked
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.revoked}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search by caption, token, or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-zinc-400 text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <div ref={statusDropdownRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setStatusDropdownOpen((prev) => !prev);
                setOrderDropdownOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-all flex items-center gap-2 justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Filter size={14} className="text-zinc-400" />
                <span>
                  {sortConfig.filterValue === "All" && "All Statuses"}
                  {sortConfig.filterValue === "Used" && "Used Only"}
                  {sortConfig.filterValue === "Unused" && "Unused Only"}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  statusDropdownOpen ? "-rotate-180" : ""
                }`}
              />
            </button>
            {statusDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      filterKey: DB.TOKENS.IS_USED,
                      filterValue: "All",
                    });
                    setStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all ${
                    sortConfig.filterValue === "All"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  All Statuses
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      filterKey: DB.TOKENS.IS_USED,
                      filterValue: "Used",
                    });
                    setStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all ${
                    sortConfig.filterValue === "Used"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Used Only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      filterKey: DB.TOKENS.IS_USED,
                      filterValue: "Unused",
                    });
                    setStatusDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all ${
                    sortConfig.filterValue === "Unused"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Unused Only
                </button>
              </div>
            )}
          </div>

          <div ref={orderDropdownRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setOrderDropdownOpen((prev) => !prev);
                setStatusDropdownOpen(false);
              }}
              className="w-full sm:w-auto px-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-all flex items-center gap-2 justify-between"
            >
              <span>
                {sortConfig.direction === "desc"
                  ? "Newest First"
                  : "Oldest First"}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  orderDropdownOpen ? "-rotate-180" : ""
                }`}
              />
            </button>
            {orderDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      key: DB.TOKENS.CREATED_AT,
                      direction: "desc",
                    });
                    setOrderDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all ${
                    sortConfig.direction === "desc"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Newest First
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      key: DB.TOKENS.CREATED_AT,
                      direction: "asc",
                    });
                    setOrderDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-all ${
                    sortConfig.direction === "asc"
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  Oldest First
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Container — Completely Fluid with Auto Overflow Management */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {displayedTokens.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs font-medium">
            No tokens found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                  <th className="px-6 py-3.5 min-w-[150px]">Caption</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Token String</th>
                  <th className="px-4 py-3.5 min-w-[100px]">Status</th>
                  <th className="px-4 py-3.5 min-w-[150px]">Claimed By</th>
                  <th className="px-4 py-3.5 min-w-[150px]">Created At</th>
                  <th className="px-6 py-3.5 text-right min-w-[100px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {displayedTokens.map((token) => {
                  const isAdmin = token[DB.TOKENS.TOKEN_TYPE] === "admin";
                  const isRevoked = token[DB.TOKENS.IS_REVOKED];
                  const isUsed = token[DB.TOKENS.IS_USED];

                  return (
                    <tr
                      key={token[DB.TOKENS.ID]}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-3.5 font-medium text-zinc-900">
                        <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                          <span>{token[DB.TOKENS.CAPTION] || "—"}</span>
                          {isAdmin && (
                            <span className="bg-zinc-900 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <code className="font-mono text-xxs bg-zinc-50 text-zinc-600 px-2 py-1 rounded border border-zinc-200 block truncate max-w-[280px]">
                          {token[DB.TOKENS.TOKEN_STRING]
                            ? token[DB.TOKENS.TOKEN_STRING].replace(
                                "https://t.me/",
                                "",
                              )
                            : "N/A"}
                        </code>
                      </td>

                      <td className="px-4 py-3.5">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider">
                            Revoked
                          </span>
                        ) : isUsed ? (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider">
                            Used
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-zinc-50 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-full text-xxs font-semibold uppercase tracking-wider">
                            Unused
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-600">
                        {isUsed ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900 text-xs">
                              @{token[DB.TOKENS.USED_BY_USER] || "Unknown"}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">
                              ID: {token[DB.TOKENS.USED_BY_ID]}
                            </span>
                          </div>
                        ) : isRevoked ? (
                          <span className="text-zinc-400 text-xs">—</span>
                        ) : (
                          <span className="text-zinc-400 italic text-xs">
                            Pending...
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-zinc-500 text-xs">
                        {new Date(token[DB.TOKENS.CREATED_AT]).toLocaleString(
                          [],
                          {
                            dateStyle: "medium",
                            timeStyle: "short",
                          },
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              copyToClipboard(
                                token[DB.TOKENS.TOKEN_STRING],
                                token[DB.TOKENS.ID],
                              )
                            }
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                            title="Copy Full Link"
                          >
                            {copied === token[DB.TOKENS.ID] ? (
                              <Check size={14} className="text-green-600" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>

                          {!isAdmin && (
                            <button
                              onClick={() =>
                                deleteToken(
                                  token[DB.TOKENS.ID],
                                  token[DB.TOKENS.TOKEN_TYPE],
                                )
                              }
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Token"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
