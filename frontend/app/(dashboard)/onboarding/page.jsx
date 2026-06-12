"use client";

import { useState, useEffect, useMemo } from "react";
import {
  UserPlus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  Ticket,
  Users,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

export default function OnboardingStatusPage() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Onboarding Status | ${siteConfig.name}`;
    async function fetchOnboardingStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch all tokens created by this manager
        const { data: generatedTokens } = await supabase
          .from(DB.TOKENS.TABLE)
          .select("*")
          .order(DB.TOKENS.CREATED_AT, { ascending: false });

        if (!generatedTokens) return;

        // 2. Fetch all completed onboarding leads to cross-reference
        const { data: completedLeads } = await supabase
          .from(DB.ONBOARDING.TABLE)
          .select(`${DB.ONBOARDING.TELEGRAM_ID}, ${DB.ONBOARDING.FULL_NAME}`);

        // 3. Map the completion status to the tokens
        const mergedData = generatedTokens.map((token) => {
          const isCompleted = completedLeads?.find(
            (lead) =>
              lead[DB.ONBOARDING.TELEGRAM_ID] === token[DB.TOKENS.USED_BY_ID],
          );

          return {
            ...token,
            onboarded_name: isCompleted
              ? isCompleted[DB.ONBOARDING.FULL_NAME]
              : null,
            is_completed: !!isCompleted,
          };
        });

        setTokens(mergedData);
      } catch (err) {
        console.error("Unexpected parsing error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOnboardingStatus();
  }, []);

  // Compute breakdown statistics dynamically for top dashboard metrics
  const stats = useMemo(() => {
    const total = tokens.length;
    const completed = tokens.filter(
      (t) => t.is_completed && t[DB.TOKENS.TOKEN_TYPE] !== "admin",
    ).length;
    const adminTokens = tokens.filter(
      (t) => t[DB.TOKENS.TOKEN_TYPE] === "admin",
    ).length;
    const pending = total - completed - adminTokens;

    return { total, completed, adminTokens, pending };
  }, [tokens]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Compiling onboarding analytics...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
            <UserPlus size={22} className="text-primary" />
          </div>
          Team Onboarding Status
        </h1>
        <p className="text-[0.95rem] text-grey-500 mt-1">
          Track which team members have initialized and completed their
          personalized corporate training modules.
        </p>
      </div>

      {/* Balanced Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-primary-light text-primary rounded-[12px] shrink-0">
            <Ticket size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Total Invites
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-[#F0FDF4] text-[#16a34a] rounded-[12px] shrink-0">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Onboarded
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.completed}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-amber-50 text-amber-500 rounded-[12px] shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Pending
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.pending}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-[12px] shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Admin Keys
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.adminTokens}
            </p>
          </div>
        </div>
      </div>

      {/* Tight, Scannable Table Layout */}
      <div className="bg-white rounded-[16px] border border-grey-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-grey-50 border-b border-grey-100 text-[10px] uppercase tracking-wider text-grey-500 font-bold">
                <th className="px-6 py-4 w-1/4">Assignment Name</th>
                <th className="px-6 py-4 w-1/4">Secure Invite Link</th>
                <th className="px-6 py-4 w-1/6">Assigned Role</th>
                <th className="px-6 py-4 w-1/6">Telegram Profile</th>
                <th className="px-6 py-4 text-right w-1/6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100 text-[0.92rem]">
              {tokens.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-12 text-grey-400 text-sm font-medium"
                  >
                    No active or pending invite metrics found in database
                    records.
                  </td>
                </tr>
              ) : (
                tokens.map((token) => (
                  <tr
                    key={token.id}
                    className="hover:bg-grey-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-navy font-display">
                      {token[DB.TOKENS.CAPTION] || "Unassigned Voucher"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="bg-grey-50 border border-grey-100 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold text-grey-600">
                        {token[DB.TOKENS.TOKEN_STRING]
                          ? token[DB.TOKENS.TOKEN_STRING].split("start=")[1] ||
                            token[DB.TOKENS.TOKEN_STRING]
                          : "N/A"}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          token[DB.TOKENS.TOKEN_TYPE] === "admin"
                            ? "bg-navy text-white shadow-sm"
                            : "bg-primary-light text-primary"
                        }`}
                      >
                        {token[DB.TOKENS.TOKEN_TYPE] || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {token[DB.TOKENS.USED_BY_ID] ? (
                        <Link
                          href={`/users/${token[DB.TOKENS.USED_BY_ID]}`}
                          className="font-bold text-navy flex items-center gap-2 hover:text-primary transition-colors w-fit"
                        >
                          <User
                            size={14}
                            className="text-primary/70 shrink-0"
                          />
                          <span>{token[DB.TOKENS.USED_BY_ID]}</span>
                        </Link>
                      ) : (
                        <span className="text-grey-400 text-[10px] font-bold uppercase tracking-widest bg-grey-50 px-2.5 py-1 rounded-md border border-grey-100">
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap animate-none">
                      {token[DB.TOKENS.TOKEN_TYPE] === "admin" ? (
                        <div className="inline-flex items-center gap-1.5 text-grey-400 font-bold text-[10px] uppercase tracking-wider">
                          <ShieldAlert size={14} /> <span>Bypassed</span>
                        </div>
                      ) : token.is_completed ? (
                        <div className="inline-flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-[#16a34a] font-bold text-[0.92rem]">
                            <CheckCircle2 size={16} /> <span>Completed</span>
                          </div>
                          {token.onboarded_name && (
                            <span className="text-[10px] font-bold tracking-wide text-grey-500 mt-1">
                              {token.onboarded_name}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-amber-500 font-bold text-[0.92rem]">
                          <Clock size={16} /> <span>Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
