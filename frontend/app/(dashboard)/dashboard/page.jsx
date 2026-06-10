"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  Search,
  Filter,
  Mail,
  X,
  RefreshCw,
  ExternalLink,
  Ticket,
  Users,
  BookOpenCheck,
  LineChart,
  Layers,
  ArrowUpRight,
  ChevronDown,
  MoreVertical,
} from "lucide-react";
import gsap from "gsap";
import { DB } from "@/app/lib/schema_map";
import { applyFiltersAndSort } from "../../utils/sortUtils";
import { sendInviteLink } from "../../lib/email";
import { supabase } from "@/app/lib/supabase";
import { siteConfig } from "@/app/utils/config";

export default function DashboardHome() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);
  const createBtnRef = useRef(null);

  // Global cross-page summary metrics states
  const [totalOnboardedLeads, setTotalOnboardedLeads] = useState(0);
  const [trainingStats, setTrainingStats] = useState({
    completed: 0,
    partial: 0,
  });
  const [totalTestsTaken, setTotalTestsTaken] = useState(0);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCaption, setModalCaption] = useState("");
  const [modalEmail, setModalEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sort/Filter state
  const [sortConfig, setSortConfig] = useState({
    key: DB.TOKENS.CREATED_AT,
    direction: "desc",
    filterKey: DB.TOKENS.IS_USED,
    filterValue: "All",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // GSAP Modal Animation
  useEffect(() => {
    document.title = `Dashboard | ${siteConfig.name}`;
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      if (modalRef.current && overlayRef.current) {
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" },
        );
        gsap.fromTo(
          modalRef.current,
          { opacity: 0, y: 30, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          },
        );
        const inputs = modalRef.current.querySelectorAll("input, textarea");
        gsap.fromTo(
          inputs,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            delay: 0.2,
          },
        );
        const buttons = modalRef.current.querySelectorAll(
          "button[type='button'], button[type='submit']",
        );
        gsap.fromTo(
          buttons,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.4 },
        );
      }
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  // Hover animation for create button
  useEffect(() => {
    if (createBtnRef.current) {
      const btn = createBtnRef.current;
      const enter = () =>
        gsap.to(btn, { scale: 1.04, duration: 0.25, ease: "power2.out" });
      const leave = () =>
        gsap.to(btn, { scale: 1, duration: 0.25, ease: "power2.out" });
      btn.addEventListener("mouseenter", enter);
      btn.addEventListener("mouseleave", leave);
      return () => {
        btn.removeEventListener("mouseenter", enter);
        btn.removeEventListener("mouseleave", leave);
      };
    }
  }, []);

  useEffect(() => {
    fetchGlobalDashboardMetrics();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGlobalDashboardMetrics = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tokenData } = await supabase
        .from(DB.TOKENS.TABLE)
        .select("*")
        .eq(DB.TOKENS.CREATED_BY, user.id)
        .order(DB.TOKENS.CREATED_AT, { direction: "desc" });
      if (tokenData) setTokens(tokenData);

      const { data: leadsData } = await supabase
        .from(DB.ONBOARDING.TABLE)
        .select(`id, training_status`)
        .eq("admin_id", user.id);

      if (leadsData) {
        setTotalOnboardedLeads(leadsData.length);
        const completed = leadsData.filter(
          (l) => l.training_status === "completed",
        ).length;
        const partial = leadsData.filter(
          (l) => l.training_status === "partial",
        ).length;
        setTrainingStats({ completed, partial });
      }

      const { count: testCount } = await supabase
        .from("test_results")
        .select("*", { count: "exact", head: true })
        .eq("admin_id", user.id);
      setTotalTestsTaken(testCount || 0);
    } catch (err) {
      console.error("Error building multi-pane workspace matrices:", err);
    } finally {
      setLoading(false);
    }
  };

  const tokenStats = useMemo(() => {
    const total = tokens.length;
    const consumed = tokens.filter((t) => t[DB.TOKENS.IS_USED]).length;
    const activeAvailable = tokens.filter(
      (t) => !t[DB.TOKENS.IS_USED] && !t[DB.TOKENS.IS_REVOKED],
    ).length;
    return { total, consumed, activeAvailable };
  }, [tokens]);

  const generateToken = async (e) => {
    e.preventDefault();
    if (!modalCaption.trim()) return;
    setIsGenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uniqueToken =
        "token_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      const isLocalhost =
        typeof window !== "undefined"
          ? window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          : process.env.NODE_ENV === "development";
      const botUsername = isLocalhost
        ? "devRagbot"
        : siteConfig.botUsername || "DrishRag_Bot";
      const generatedLink = `https://t.me/${botUsername}?start=${uniqueToken}`;

      const payload = {
        [DB.TOKENS.TOKEN_STRING]: generatedLink,
        [DB.TOKENS.CREATED_BY]: user.id,
        [DB.TOKENS.IS_USED]: false,
        [DB.TOKENS.CAPTION]: modalCaption,
        [DB.TOKENS.TOKEN_TYPE]: "user",
        [DB.TOKENS.IS_REVOKED]: false,
        sent_to: modalEmail || null,
      };

      const { data, error } = await supabase
        .from(DB.TOKENS.TABLE)
        .insert([payload])
        .select();
      if (error) throw error;
      if (modalEmail.trim() && data)
        await sendInviteLink(modalEmail, generatedLink, modalCaption);

      setModalCaption("");
      setModalEmail("");

      if (modalRef.current && overlayRef.current) {
        gsap.to(overlayRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        });
        gsap.to(modalRef.current, {
          opacity: 0,
          y: 30,
          scale: 0.95,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => {
            setIsModalOpen(false);
            fetchGlobalDashboardMetrics();
          },
        });
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate token.");
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteToken = async (id, tokenType) => {
    if (tokenType === "admin") {
      alert("System Protected: Admin vouchers cannot be removed.");
      return;
    }
    if (!confirm("Remove this token?")) return;
    const { error } = await supabase
      .from(DB.TOKENS.TABLE)
      .delete()
      .eq(DB.TOKENS.ID, id);
    if (!error) setTokens(tokens.filter((t) => t[DB.TOKENS.ID] !== id));
  };

  const copyToClipboard = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredTokens = useMemo(() => {
    let output = tokens;
    if (searchQuery) {
      output = output.filter(
        (t) =>
          t[DB.TOKENS.CAPTION]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          t[DB.TOKENS.TOKEN_STRING]
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }
    return applyFiltersAndSort(output, sortConfig, DB);
  }, [tokens, searchQuery, sortConfig]);

  const closeModal = () => {
    if (modalRef.current && overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });
      gsap.to(modalRef.current, {
        opacity: 0,
        y: 30,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => setIsModalOpen(false),
      });
    }
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="p-8 space-y-5" style={{ minHeight: "100%" }}>
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-[1.75rem] font-bold tracking-tight"
            style={{ color: "#0f172a" }}
          >
            Access Tokens
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
            Manage and distribute registration links
          </p>
        </div>

        <button
          ref={createBtnRef}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{
            background: "#2563eb",
            boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
          }}
        >
          <Plus size={16} />
          Create Token
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Tokens */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid #e8ecf4",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#eef2ff" }}
            >
              <Layers size={20} style={{ color: "#4f46e5" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#94a3b8" }}
              >
                Total Tokens
              </p>
              <p
                className="text-3xl font-bold leading-none mt-0.5"
                style={{ color: "#0f172a" }}
              >
                {tokenStats.total}
              </p>
            </div>
          </div>
          <div
            className="mt-4 h-[3px] rounded-full overflow-hidden"
            style={{ background: "#e8ecf4" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width:
                  tokenStats.total > 0
                    ? `${Math.min((tokenStats.activeAvailable / tokenStats.total) * 100, 100)}%`
                    : "0%",
                background: "#2563eb",
                transition: "width 0.7s ease",
              }}
            />
          </div>
        </div>

        {/* Active */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid #e8ecf4",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#ecfdf5" }}
            >
              <ArrowUpRight size={20} style={{ color: "#10b981" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#94a3b8" }}
              >
                Active
              </p>
              <p
                className="text-3xl font-bold leading-none mt-0.5"
                style={{ color: "#0f172a" }}
              >
                {tokenStats.activeAvailable}
              </p>
            </div>
          </div>
          <p
            className="text-xs mt-4 font-semibold"
            style={{ color: "#10b981" }}
          >
            Ready to distribute
          </p>
        </div>

        {/* Consumed */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid #e8ecf4",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#f5f3ff" }}
            >
              <Check size={20} style={{ color: "#7c3aed" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#94a3b8" }}
              >
                Consumed
              </p>
              <p
                className="text-3xl font-bold leading-none mt-0.5"
                style={{ color: "#0f172a" }}
              >
                {tokenStats.consumed}
              </p>
            </div>
          </div>
          <p className="text-xs mt-4 font-medium" style={{ color: "#94a3b8" }}>
            Successfully used
          </p>
        </div>

        {/* Onboarded */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: "#fff",
            border: "1px solid #e8ecf4",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#fff7ed" }}
            >
              <Users size={20} style={{ color: "#f59e0b" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "#94a3b8" }}
              >
                Onboarded
              </p>
              <p
                className="text-3xl font-bold leading-none mt-0.5"
                style={{ color: "#0f172a" }}
              >
                {totalOnboardedLeads}
              </p>
            </div>
          </div>
          <p className="text-xs mt-4 font-medium" style={{ color: "#94a3b8" }}>
            Active participants
          </p>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          background: "#fff",
          border: "1px solid #e8ecf4",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <Search
          size={15}
          className="flex-shrink-0"
          style={{ color: "#c0c9d8" }}
        />
        <input
          type="text"
          placeholder="Search tokens..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 text-sm outline-none bg-transparent"
          style={{ color: "#0f172a" }}
        />

        <div className="relative flex-shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={{
              background: "#f8fafc",
              borderColor: "#e2e8f0",
              color: "#374151",
              border: "1px solid #e2e8f0",
            }}
          >
            <Filter size={12} style={{ color: "#94a3b8" }} />
            {sortConfig.filterValue}
            <ChevronDown
              size={12}
              style={{
                color: "#94a3b8",
                transition: "transform 0.2s",
                transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full right-0 mt-2 w-44 rounded-xl overflow-hidden z-40"
              style={{
                background: "#fff",
                border: "1px solid #e8ecf4",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              {["All", "Used", "Unused"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSortConfig({ ...sortConfig, filterValue: val });
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-all"
                  style={{
                    color:
                      sortConfig.filterValue === val ? "#2563eb" : "#374151",
                    background:
                      sortConfig.filterValue === val
                        ? "#eff6ff"
                        : "transparent",
                  }}
                >
                  {val === "All"
                    ? "All Tokens"
                    : val === "Used"
                      ? "Consumed"
                      : "Unclaimed"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tokens Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          border: "1px solid #e8ecf4",
          boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {[
                  "Type",
                  "Caption / Purpose",
                  "Token Link",
                  "Status",
                  "User",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: "#94a3b8" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTokens.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-sm font-medium"
                    style={{ color: "#94a3b8" }}
                  >
                    No matching invite structures active inside this section.
                  </td>
                </tr>
              )}
              {filteredTokens.map((token, idx) => {
                const link = token[DB.TOKENS.TOKEN_STRING] || "";
                const isConsumed = token[DB.TOKENS.IS_USED];
                const isAdmin = token[DB.TOKENS.TOKEN_TYPE] === "admin";
                const isRevoked = token[DB.TOKENS.IS_REVOKED];
                const username = token[DB.TOKENS.USED_BY_USER];
                const note = token[DB.TOKENS.CAPTION] || "—";

                return (
                  <tr
                    key={token[DB.TOKENS.ID]}
                    style={{
                      borderBottom:
                        idx < filteredTokens.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                      background: isRevoked ? "#fff5f5" : "#fff",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isRevoked)
                        e.currentTarget.style.background = "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isRevoked
                        ? "#fff5f5"
                        : "#fff";
                    }}
                  >
                    {/* Type */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={
                          isRevoked
                            ? { background: "#fee2e2", color: "#dc2626" }
                            : isAdmin
                              ? { background: "#0f172a", color: "#fff" }
                              : { background: "#1e293b", color: "#fff" }
                        }
                      >
                        {isRevoked ? "Revoked" : isAdmin ? "Admin" : "User"}
                      </span>
                    </td>

                    {/* Caption */}
                    <td
                      className="px-5 py-4 text-sm font-medium max-w-[160px] truncate"
                      style={{ color: "#374151" }}
                    >
                      {note}
                    </td>

                    {/* Link */}
                    <td className="px-5 py-4 max-w-[240px]">
                      <span
                        className="text-xs truncate block"
                        style={{ color: isRevoked ? "#fca5a5" : "#2563eb" }}
                      >
                        {link}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {isRevoked ? (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      ) : isConsumed ? (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "#94a3b8" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#cbd5e1" }}
                          />
                          Used
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            background: "#dcfce7",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#16a34a" }}
                          />
                          Ready
                        </span>
                      )}
                    </td>

                    {/* User */}
                    <td
                      className="px-5 py-4 text-xs"
                      style={{ color: "#64748b" }}
                    >
                      {isConsumed && username ? (
                        <span
                          className="font-semibold"
                          style={{ color: "#0f172a" }}
                        >
                          @{username}
                        </span>
                      ) : (
                        <span style={{ color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* Open */}
                        <button
                          onClick={() => window.open(link, "_blank")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={
                            isConsumed || isRevoked
                              ? {
                                  background: "#f8fafc",
                                  color: "#94a3b8",
                                  cursor: "default",
                                  border: "1px solid #e2e8f0",
                                }
                              : {
                                  background: "#f8fafc",
                                  color: "#374151",
                                  border: "1px solid #e2e8f0",
                                }
                          }
                          title="Open Telegram Link"
                        >
                          <ExternalLink size={11} />
                          Open
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() =>
                            copyToClipboard(link, token[DB.TOKENS.ID])
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          style={{
                            background: "#f8fafc",
                            color: "#374151",
                            border: "1px solid #e2e8f0",
                          }}
                          title="Copy Link"
                        >
                          {copied === token[DB.TOKENS.ID] ? (
                            <>
                              <Check size={11} style={{ color: "#10b981" }} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              Copy
                            </>
                          )}
                        </button>

                        {/* Three-dot menu */}
                        {!isAdmin && (
                          <button
                            onClick={() =>
                              deleteToken(
                                token[DB.TOKENS.ID],
                                token[DB.TOKENS.TOKEN_TYPE],
                              )
                            }
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "#cbd5e1" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = "#64748b";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "#cbd5e1";
                            }}
                            title="More options"
                          >
                            <MoreVertical size={15} />
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
      </div>

      {/* ── Create Token Modal ── */}
      {isModalOpen && (
        <>
          <div
            ref={overlayRef}
            onClick={closeModal}
            className="fixed inset-0 z-50"
            style={{
              background: "rgba(15,23,42,0.45)",
              backdropFilter: "blur(6px)",
              left: 0,
              top: 0,
              width: "100vw",
              height: "100vh",
            }}
          />
          <div
            ref={modalRef}
            className="fixed z-50 flex items-center justify-center pointer-events-none"
            style={{ left: 0, top: 0, width: "100vw", height: "100vh" }}
          >
            <div
              className="rounded-3xl overflow-hidden pointer-events-auto"
              style={{
                maxWidth: "480px",
                width: "calc(100% - 2rem)",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                boxShadow: "0 32px 64px rgba(15,23,42,0.2)",
              }}
            >
              {/* Modal Header */}
              <div
                className="relative px-8 pt-8 pb-6 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #0ea5e9 100%)",
                }}
              >
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20"
                  style={{
                    background: "rgba(255,255,255,0.4)",
                    filter: "blur(40px)",
                  }}
                />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        border: "1px solid rgba(255,255,255,0.3)",
                      }}
                    >
                      <Plus size={22} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        New Token
                      </h2>
                      <p
                        className="text-sm mt-0.5 font-medium"
                        style={{ color: "rgba(255,255,255,0.75)" }}
                      >
                        Secure registration link for team members
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-xl transition-all flex-shrink-0"
                    style={{
                      color: "rgba(255,255,255,0.7)",
                      border: "1px solid rgba(255,255,255,0.25)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.15)";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Form */}
              <form
                onSubmit={generateToken}
                className="px-8 py-7 space-y-5 bg-white"
              >
                {/* Purpose */}
                <div className="space-y-2">
                  <label
                    className="block text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#374151" }}
                  >
                    Purpose
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sales Team - Q1 2024"
                    value={modalCaption}
                    onChange={(e) => setModalCaption(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      color: "#0f172a",
                      background: "#f8fafc",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.background = "#f8fafc";
                    }}
                  />
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Who is this token for or what's its purpose
                  </p>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label
                      className="block text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#374151" }}
                    >
                      Email
                    </label>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        background: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      Optional
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="team@company.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      border: "1.5px solid #e2e8f0",
                      color: "#0f172a",
                      background: "#f8fafc",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#2563eb";
                      e.target.style.background = "#fff";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                      e.target.style.background = "#f8fafc";
                    }}
                  />
                  <p className="text-xs" style={{ color: "#94a3b8" }}>
                    Leave blank to copy manually, or we'll send it to their
                    inbox
                  </p>
                </div>

                <div style={{ height: "1px", background: "#f1f5f9" }} />

                {/* Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: "#f8fafc",
                      color: "#374151",
                      border: "1.5px solid #e2e8f0",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f1f5f9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#f8fafc")
                    }
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating || !modalCaption.trim()}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2.5"
                    style={{
                      background:
                        isGenerating || !modalCaption.trim()
                          ? "#cbd5e1"
                          : "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                      boxShadow:
                        !isGenerating && modalCaption.trim()
                          ? "0 6px 18px rgba(37,99,235,0.3)"
                          : "none",
                      cursor:
                        isGenerating || !modalCaption.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Generate Token
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
