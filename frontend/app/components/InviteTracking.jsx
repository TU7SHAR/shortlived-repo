"use client";

import { useEffect, useState } from "react";
import { ensureAdminToken } from "../lib/db";
import { supabase } from "../lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { Loader2 } from "lucide-react";

export default function InviteTracking() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          setLoading(false);
          return;
        }

        await ensureAdminToken(user.id);

        const { data: tokensData, error: tokenError } = await supabase
          .from(DB.TOKENS.TABLE)
          .select("*")
          .eq(DB.TOKENS.CREATED_BY, user.id)
          .order(DB.TOKENS.CREATED_AT, { ascending: false });

        if (tokenError) {
          console.error("Supabase Error:", tokenError);
        }

        setTokens(tokensData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Syncing token database...
      </div>
    );
  }

  return (
    <div className="bg-white border border-grey-100 rounded-xl overflow-hidden shadow-sm">
      {/* Mobile Responsive Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-grey-50 text-grey-500 text-[10px] uppercase tracking-widest font-bold">
              <th className="p-4 border-b border-grey-100 whitespace-nowrap">
                Type
              </th>
              <th className="p-4 border-b border-grey-100">Token Link</th>
              <th className="p-4 border-b border-grey-100 whitespace-nowrap">
                Status
              </th>
              <th className="p-4 border-b border-grey-100">User / Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">
            {tokens.length === 0 && (
              <tr>
                <td
                  colSpan="4"
                  className="p-8 text-center text-grey-400 text-sm font-medium"
                >
                  No active tokens generated yet.
                </td>
              </tr>
            )}
            {tokens.map((t) => {
              const type = t[DB.TOKENS.TOKEN_TYPE] || "normal";
              const link = t[DB.TOKENS.TOKEN_STRING];
              const isUsed = t[DB.TOKENS.IS_USED];
              const isRevoked = t[DB.TOKENS.IS_REVOKED];
              const username = t[DB.TOKENS.USED_BY_USER];
              const note = t[DB.TOKENS.CAPTION] || "—";

              return (
                <tr
                  key={t[DB.TOKENS.ID]}
                  title={isRevoked ? "This token is revoked" : ""}
                  className={`text-[0.92rem] transition-colors ${
                    isRevoked
                      ? "bg-red-50/50 hover:bg-red-50 cursor-help"
                      : "hover:bg-grey-50"
                  }`}
                >
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isRevoked
                          ? "bg-red-50 text-red-600 border border-red-100"
                          : type === "admin"
                            ? "bg-navy text-white"
                            : "bg-primary-light text-primary"
                      }`}
                    >
                      {isRevoked ? "Revoked" : type}
                    </span>
                  </td>
                  <td
                    className={`p-4 font-mono text-xs truncate max-w-[200px] ${isRevoked ? "text-red-400" : "text-grey-500"}`}
                  >
                    {link}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {isRevoked ? (
                      <span className="text-grey-400">—</span>
                    ) : isUsed ? (
                      <span className="flex items-center gap-2 text-xs font-semibold text-grey-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-grey-300"></div>{" "}
                        Used
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-xs font-semibold text-[#16a34a]">
                        {/* Uses the bright green from the HTML template */}
                        <div className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></div>{" "}
                        Ready
                      </span>
                    )}
                  </td>
                  <td
                    className={`p-4 text-xs ${isRevoked ? "text-red-400" : "text-grey-500"}`}
                  >
                    {isUsed && username ? (
                      <span
                        className={`font-semibold ${isRevoked ? "text-red-400" : "text-navy"}`}
                      >
                        @{username}
                      </span>
                    ) : isRevoked ? (
                      <span className="italic opacity-70">—</span>
                    ) : (
                      <span className="italic">{note}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
