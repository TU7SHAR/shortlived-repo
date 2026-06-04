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

  // Initialize sort state using the DB Map
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
      // Prevent scrolling
      document.body.style.overflow = "hidden";

      if (modalRef.current && overlayRef.current) {
        // Animate overlay
        gsap.fromTo(
          overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: "power2.out" },
        );

        // Animate modal
        gsap.fromTo(
          modalRef.current,
          {
            opacity: 0,
            y: 30,
            scale: 0.95,
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.5,
            ease: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          },
        );

        // Animate form elements
        const inputs = modalRef.current.querySelectorAll("input");
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
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            delay: 0.4,
          },
        );
      }
    } else {
      // Re-enable scrolling
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
      const handleMouseEnter = () => {
        gsap.to(btn, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out",
        });
      };

      const handleMouseLeave = () => {
        gsap.to(btn, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out",
        });
      };

      btn.addEventListener("mouseenter", handleMouseEnter);
      btn.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        btn.removeEventListener("mouseenter", handleMouseEnter);
        btn.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  // Flame animation for modal button
  useEffect(() => {
    if (isModalOpen) {
      const flames = document.querySelectorAll(".flame-particle");
      flames.forEach((flame, index) => {
        gsap.fromTo(
          flame,
          { y: 0, opacity: 0.9 },
          {
            y: -30 - index * 5,
            x: Math.sin(index) * 15,
            opacity: 0,
            duration: 1.2 + index * 0.1,
            repeat: -1,
            repeatDelay: 0.3,
            ease: "sine.inOut",
          },
        );
      });
    }
  }, [isModalOpen]);

  useEffect(() => {
    fetchGlobalDashboardMetrics();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
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

      // 1. Fetch Tokens Generated By Admin
      const { data: tokenData } = await supabase
        .from(DB.TOKENS.TABLE)
        .select("*")
        .eq(DB.TOKENS.CREATED_BY, user.id)
        .order(DB.TOKENS.CREATED_AT, { direction: "desc" });

      if (tokenData) setTokens(tokenData);

      // 2. Fetch Onboarding Leads Counts
      const { data: leadsData } = await supabase
        .from(DB.ONBOARDING.TABLE)
        .select(`id, training_status`);

      if (leadsData) {
        setTotalOnboardedLeads(leadsData.length);

        // Sum up training status metrics dynamically
        const completed = leadsData.filter(
          (l) => l.training_status === "completed",
        ).length;
        const partial = leadsData.filter(
          (l) => l.training_status === "partial",
        ).length;
        setTrainingStats({ completed, partial });
      }

      // 3. Fetch Test Analytics Counts Taken by Trainees
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

  // Compute Invitation & Voucher Metrics Dynamically
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

      if (modalEmail.trim() && data) {
        await sendInviteLink(modalEmail, generatedLink, modalCaption);
      }

      setModalCaption("");
      setModalEmail("");

      // Close modal with animation
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
    if (!error) {
      setTokens(tokens.filter((t) => t[DB.TOKENS.ID] !== id));
    }
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

  return (
    <div className="p-8 space-y-8">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Access Tokens</h1>
          <p className="text-grey-500">
            Manage and distribute registration links
          </p>
        </div>
        <button
          ref={createBtnRef}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 font-semibold transition-all shadow-sm"
        >
          <Plus size={18} />
          Create Token
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-grey-50 rounded-xl border border-grey-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-grey-500 text-xs font-bold uppercase tracking-wider mb-1">
                Total Tokens
              </p>
              <p className="text-3xl font-bold text-navy">{tokenStats.total}</p>
            </div>
            <Layers size={24} className="text-grey-300" />
          </div>
          <div className="mt-3 h-1 bg-grey-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-2/3" />
          </div>
        </div>

        <div className="bg-grey-50 rounded-xl border border-grey-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-grey-500 text-xs font-bold uppercase tracking-wider mb-1">
                Active
              </p>
              <p className="text-3xl font-bold text-navy">
                {tokenStats.activeAvailable}
              </p>
            </div>
            <ArrowUpRight size={24} className="text-grey-300" />
          </div>
          <p className="text-xs text-grey-500 mt-3">Ready to distribute</p>
        </div>

        <div className="bg-grey-50 rounded-xl border border-grey-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-grey-500 text-xs font-bold uppercase tracking-wider mb-1">
                Consumed
              </p>
              <p className="text-3xl font-bold text-navy">
                {tokenStats.consumed}
              </p>
            </div>
            <Check size={24} className="text-grey-300" />
          </div>
          <p className="text-xs text-grey-500 mt-3">Successfully used</p>
        </div>

        <div className="bg-grey-50 rounded-xl border border-grey-100 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-grey-500 text-xs font-bold uppercase tracking-wider mb-1">
                Onboarded
              </p>
              <p className="text-3xl font-bold text-navy">
                {totalOnboardedLeads}
              </p>
            </div>
            <Users size={24} className="text-grey-300" />
          </div>
          <p className="text-xs text-grey-500 mt-3">Active participants</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-300"
          />
          <input
            type="text"
            placeholder="Search tokens by caption or link..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-grey-100 shadow-sm rounded-xl pl-10 pr-4 py-2.5 text-navy placeholder-grey-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all shadow-sm ${
              dropdownOpen
                ? "text-white border-primary"
                : "bg-white text-navy border-grey-100 hover:border-grey-300"
            }`}
            style={
              dropdownOpen
                ? {
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                  }
                : {}
            }
          >
            <Filter size={14} />
            {sortConfig.filterValue}
            <ChevronDown
              size={14}
              className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-grey-100 rounded-xl shadow-md overflow-hidden z-40">
              {["All", "Used", "Unused"].map((val, i) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setSortConfig({
                      ...sortConfig,
                      filterValue:
                        val === "Used"
                          ? "Used"
                          : val === "Unused"
                            ? "Unused"
                            : "All",
                    });
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all ${
                    sortConfig.filterValue === val
                      ? "text-primary bg-primary-light"
                      : "text-grey-700 hover:bg-grey-50"
                  }`}
                >
                  {val === "All"
                    ? "All"
                    : val === "Used"
                      ? "Consumed Vouchers"
                      : "Unclaimed Vouchers"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tokens List */}
      <div className="bg-white rounded-xl border border-grey-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-grey-500 border-b border-grey-100 bg-grey-50">
          Active Links List
        </div>
        {filteredTokens.length === 0 ? (
          <div className="py-12 text-center text-grey-500 text-xs font-medium">
            No matching invite structures active inside this section.
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filteredTokens.map((token) => {
              const link = token[DB.TOKENS.TOKEN_STRING] || "";
              const isConsumed = token[DB.TOKENS.IS_USED];
              const isAdmin = token[DB.TOKENS.TOKEN_TYPE] === "admin";

              return (
                <div
                  key={token[DB.TOKENS.ID]}
                  className="bg-white border border-grey-100 rounded-xl p-4 hover:border-grey-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: isConsumed ? "#64748b" : "#1d4ed8",
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy truncate">
                          {token[DB.TOKENS.CAPTION] || "Unnamed Token"}
                        </p>
                        {isAdmin && (
                          <p className="text-xs text-grey-500 mt-0.5">
                            Admin Token
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide ${
                        isConsumed
                          ? "bg-grey-100 text-grey-500"
                          : "bg-primary-light text-primary"
                      }`}
                    >
                      {isConsumed ? "Used" : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-grey-500 mb-1.5">
                        Link
                      </p>
                      <p className="text-xs text-grey-700 font-mono bg-grey-50 border border-grey-100 rounded-lg px-3 py-2 truncate">
                        {link}
                      </p>
                    </div>
                  </div>

                  {isConsumed && token[DB.TOKENS.USED_BY_USER] && (
                    <p className="text-xs text-grey-500 mb-3">
                      Used by{" "}
                      <span className="font-semibold text-navy">
                        @{token[DB.TOKENS.USED_BY_USER]}
                      </span>
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.open(link, "_blank")}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                        isConsumed
                          ? "bg-grey-100 text-grey-500 hover:bg-grey-300"
                          : "bg-primary text-white hover:bg-primary/90 shadow-sm"
                      }`}
                      title="Open Telegram Link"
                    >
                      <ExternalLink size={12} />
                      Open
                    </button>
                    <button
                      onClick={() => copyToClipboard(link, token[DB.TOKENS.ID])}
                      className="text-xs px-3 py-1.5 rounded-lg bg-grey-50 border border-grey-100 text-grey-700 hover:bg-grey-100 hover:border-grey-300 transition-all font-semibold flex items-center gap-1"
                      title="Copy Link"
                    >
                      {copied === token[DB.TOKENS.ID] ? (
                        <>
                          <Check size={12} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <>
          <div
            ref={overlayRef}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            style={{ left: 0, top: 0, width: "100vw", height: "100vh" }}
          />
          <div
            ref={modalRef}
            className="fixed z-50 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{ left: 0, top: 0, width: "100vw", height: "100vh" }}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-grey-100"
              style={{
                maxWidth: "600px",
                width: "calc(100% - 2rem)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Header with gradient and icon */}
              <div
                className="relative px-8 pt-8 pb-8 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #0a1628 0%, #122040 50%, #0a1628 100%)",
                }}
              >
                {/* Animated background elements */}
                <div
                  className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-20 -mt-20"
                  style={{ backgroundColor: "rgba(29,78,216,0.25)" }}
                />
                <div
                  className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-3xl -ml-16 -mb-16"
                  style={{ backgroundColor: "rgba(6,182,212,0.15)" }}
                />

                <div className="relative z-10 flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Plus size={24} className="text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">
                        Create Token
                      </h2>
                      <p className="text-sm text-white/70 mt-2">
                        Generate a secure registration link for new team members
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all flex-shrink-0"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={generateToken} className="px-8 py-8 space-y-6">
                {/* Purpose Caption Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-bold text-navy">
                      Token Purpose
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sales Intern - Q1 2024"
                    value={modalCaption}
                    onChange={(e) => setModalCaption(e.target.value)}
                    className="w-full px-4 py-3.5 bg-grey-50 border border-grey-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-transparent text-sm transition-all placeholder-grey-300 hover:border-grey-300"
                  />
                  <p className="text-xs text-grey-500">
                    Who is this token for? Include name and role if applicable
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-bold text-navy">
                      Email Address
                    </label>
                    <span className="text-xs font-medium text-grey-500 bg-grey-100 px-2 py-1 rounded-md">
                      Optional
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={modalEmail}
                    onChange={(e) => setModalEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-grey-50 border border-grey-100 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:ring-offset-0 focus:border-transparent text-sm transition-all placeholder-grey-300 hover:border-grey-300"
                  />
                  <p className="text-xs text-grey-500">
                    We'll send the registration link directly to their inbox
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-grey-100 to-transparent" />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3.5 text-sm font-semibold text-grey-700 bg-grey-50 hover:bg-grey-100 rounded-xl transition-all border border-grey-100 hover:border-grey-300 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex-1 px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed rounded-xl transition-all shadow-[0_4px_16px_rgba(29,78,216,0.35)] hover:shadow-[0_6px_20px_rgba(29,78,216,0.45)] flex items-center justify-center gap-2.5 active:scale-95 relative overflow-visible group"
                    style={{
                      background:
                        "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
                    }}
                  >
                    {/* Flame animation container */}
                    {!isGenerating && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none">
                        {/* Left flame */}
                        <svg
                          className="flame-particle absolute w-2 h-3 left-0 top-0"
                          viewBox="0 0 10 15"
                          fill="none"
                        >
                          <path
                            d="M5 15C2 12 0 9 0 6C0 3 2 0 5 0C8 0 10 3 10 6C10 9 8 12 5 15Z"
                            fill="url(#grad1)"
                            opacity="0.8"
                          />
                          <defs>
                            <linearGradient
                              id="grad1"
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#bfdbfe" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Center flame */}
                        <svg
                          className="flame-particle absolute w-2.5 h-3.5 left-1 top-0"
                          viewBox="0 0 10 15"
                          fill="none"
                        >
                          <path
                            d="M5 15C2 12 0 9 0 6C0 3 2 0 5 0C8 0 10 3 10 6C10 9 8 12 5 15Z"
                            fill="url(#grad2)"
                            opacity="0.9"
                          />
                          <defs>
                            <linearGradient
                              id="grad2"
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#e0f2fe" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Right flame */}
                        <svg
                          className="flame-particle absolute w-2 h-3 left-2 top-0"
                          viewBox="0 0 10 15"
                          fill="none"
                        >
                          <path
                            d="M5 15C2 12 0 9 0 6C0 3 2 0 5 0C8 0 10 3 10 6C10 9 8 12 5 15Z"
                            fill="url(#grad3)"
                            opacity="0.8"
                          />
                          <defs>
                            <linearGradient
                              id="grad3"
                              x1="0%"
                              y1="0%"
                              x2="0%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#bfdbfe" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                    {isGenerating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        <span>Generate Token</span>
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
