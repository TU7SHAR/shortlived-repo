"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  ShieldBan,
  ShieldCheck,
  Loader2,
  Users,
  Search,
  UserCheck,
  ShieldAlert,
  Ban,
  Filter,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { applyFiltersAndSort } from "../../utils/sortUtils";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function ManageUsers() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: DB.TOKENS.CREATED_AT,
    direction: "desc",
    filterKey: null,
    filterValue: "All",
  });
  const [orderDropdownOpen, setOrderDropdownOpen] = useState(false);
  const orderDropdownRef = useRef(null);

  useEffect(() => {
    document.title = `Manage Users | ${siteConfig.name}`;
    fetchActiveUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
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

  const fetchActiveUsers = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Pulling user access parameters using token state tracking entries
    const { data, error } = await supabase
      .from(DB.TOKENS.TABLE)
      .select("*")
      .eq(DB.TOKENS.CREATED_BY, user.id)
      .eq(DB.TOKENS.IS_USED, true)
      .order(DB.TOKENS.CREATED_AT, { ascending: false });

    if (!error) setActiveUsers(data || []);
    setLoading(false);
  };

  const revokeAccess = async (telegramId, tokenId, tokenType) => {
    if (tokenType === "admin") {
      alert("Action Denied: System Admins cannot be banned.");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to revoke this user's access and ban them?",
      )
    )
      return;

    await supabase
      .from(DB.USERS.TABLE)
      .update({ [DB.USERS.IS_BANNED]: true })
      .eq(DB.USERS.ID, telegramId);

    const { error } = await supabase
      .from(DB.TOKENS.TABLE)
      .update({ [DB.TOKENS.IS_REVOKED]: true })
      .eq(DB.TOKENS.ID, tokenId);

    if (!error) {
      fetchActiveUsers();
    } else {
      alert("Failed to revoke access.");
    }
  };

  const unbanUser = async (telegramId, tokenId) => {
    if (
      !confirm(
        "Unban this user? Their old key will remain permanently burned, and they will need a new invite link to rejoin.",
      )
    )
      return;

    await supabase
      .from(DB.USERS.TABLE)
      .update({
        [DB.USERS.IS_BANNED]: false,
        [DB.USERS.TOKEN_USED]: null,
      })
      .eq(DB.USERS.ID, telegramId);

    const { error } = await supabase
      .from(DB.TOKENS.TABLE)
      .update({
        [DB.TOKENS.IS_USED]: false,
        [DB.TOKENS.USED_BY_ID]: null,
        [DB.TOKENS.USED_BY_USER]: null,
      })
      .eq(DB.TOKENS.ID, tokenId);

    if (!error) {
      fetchActiveUsers();
    } else {
      alert("Failed to remove ban.");
    }
  };

  // Compute live statistics dynamically from your query data arrays
  const stats = useMemo(() => {
    const total = activeUsers.length;
    const admins = activeUsers.filter(
      (u) => u[DB.TOKENS.TOKEN_TYPE] === "admin",
    ).length;
    const banned = activeUsers.filter((u) => u[DB.TOKENS.IS_REVOKED]).length;
    const active = total - banned - admins;

    return { total, active, banned, admins };
  }, [activeUsers]);

  const displayedUsers = useMemo(() => {
    let filtered = activeUsers;
    if (searchQuery) {
      filtered = filtered.filter(
        (u) =>
          (u[DB.TOKENS.USED_BY_USER] &&
            u[DB.TOKENS.USED_BY_USER]
              .toLowerCase()
              .includes(searchQuery.toLowerCase())) ||
          (u[DB.TOKENS.CAPTION] &&
            u[DB.TOKENS.CAPTION]
              .toLowerCase()
              .includes(searchQuery.toLowerCase())),
      );
    }
    return applyFiltersAndSort(filtered, sortConfig);
  }, [activeUsers, sortConfig, searchQuery]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-zinc-500 text-sm font-medium">
        <Loader2 className="animate-spin text-zinc-400 mr-2" size={16} />
        Compiling active user metrics...
      </div>
    );
  }

  return (
    // FIX: Fluid layout width configuration with symmetrical wrapper bounds
    <div className="p-6 md:p-8 w-full space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          User Management
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5 py-3">
          Monitor and control who has access to your Telegram bot instances.
        </p>
      </div>

      {/* Balanced Core Summary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.total}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Normal User
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.active}</p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Ban size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Banned User
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.banned}</p>
          </div>
        </div>
      </div>

      {/* Filters Panel Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
          <input
            type="text"
            placeholder="Search by username or caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-zinc-400 text-xs transition-all"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <div ref={orderDropdownRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setOrderDropdownOpen((prev) => !prev)}
              className="w-full sm:w-auto px-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-all flex items-center gap-2 justify-between"
            >
              <span className="inline-flex items-center gap-2">
                <Filter size={14} className="text-zinc-400" />
                <span>
                  {sortConfig.direction === "desc"
                    ? "Newest First"
                    : "Oldest First"}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  orderDropdownOpen ? "-rotate-180" : ""
                }`}
              />
            </button>

            {orderDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-full sm:w-44 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 overflow-hidden">
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

      {/* Dense List View Panel Layout */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden p-2">
        {displayedUsers.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs font-medium">
            No tracked profiles found matching criteria.
          </div>
        ) : (
          <div className="space-y-1">
            {displayedUsers.map((user) => {
              const isAdmin = user[DB.TOKENS.TOKEN_TYPE] === "admin";
              const isBanned = user[DB.TOKENS.IS_REVOKED];

              return (
                <div
                  key={user[DB.TOKENS.ID]}
                  className={`flex items-center justify-between p-3.5 rounded-lg border border-transparent hover:bg-zinc-50/50 transition-all ${
                    isBanned ? "bg-red-50/10" : ""
                  }`}
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div
                      className={`p-3 rounded-xl border flex-shrink-0 ${
                        isBanned
                          ? "bg-red-50 border-red-100 text-red-500"
                          : isAdmin
                            ? "bg-purple-50 border-purple-100 text-purple-600"
                            : "bg-zinc-50 border-zinc-100 text-zinc-400"
                      }`}
                    >
                      <Users size={18} />
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-900 text-sm truncate">
                          @{user[DB.TOKENS.USED_BY_USER] || "anonymous_user"}
                        </span>
                        {isBanned ? (
                          <span className="bg-red-50 text-red-700 border border-red-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            Banned
                          </span>
                        ) : isAdmin ? (
                          <span className="bg-zinc-900 text-white px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            Admin
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-700 border border-green-100 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-400 font-medium mt-0.5">
                        <span className="font-mono">
                          ID: {user[DB.TOKENS.USED_BY_ID]}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[250px]">
                          Access via:{" "}
                          {user[DB.TOKENS.CAPTION] || "Direct Admin Invite"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Controls Block */}
                  <div className="flex-shrink-0 ml-4">
                    {isAdmin ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-200 rounded-lg cursor-not-allowed select-none">
                        <ShieldCheck size={14} />
                        <span>Protected</span>
                      </div>
                    ) : isBanned ? (
                      <button
                        onClick={() =>
                          unbanUser(
                            user[DB.TOKENS.USED_BY_ID],
                            user[DB.TOKENS.ID],
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 hover:bg-green-100 border border-green-100 rounded-lg transition-all shadow-xs"
                        title="Lift Restriction"
                      >
                        <ShieldCheck size={14} />
                        <span>Remove Ban</span>
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          revokeAccess(
                            user[DB.TOKENS.USED_BY_ID],
                            user[DB.TOKENS.ID],
                            user[DB.TOKENS.TOKEN_TYPE],
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all shadow-xs"
                        title="Revoke Session & Ban"
                      >
                        <ShieldBan size={14} />
                        <span>Revoke & Ban</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
