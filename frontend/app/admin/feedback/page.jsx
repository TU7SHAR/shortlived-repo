"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Loader2, User, ShieldAlert } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { DB } from "@/app/lib/schema_map";

export default function SuperAdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    // SUPER ADMIN: Fetch ALL feedback across the entire platform
    const { data, error } = await supabase
      .from(DB.FEEDBACK.TABLE)
      .select("*")
      .order(DB.FEEDBACK.CREATED_AT, { ascending: false });

    if (!error && data) {
      setFeedbacks(data);
    } else if (error) {
      console.error("SuperAdmin Error fetching feedback:", error);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 border-b border-zinc-200 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black tracking-tight flex items-center gap-3">
            Platform Feedback <ShieldAlert className="text-red-500" size={28} />
          </h1>
          <p className="text-zinc-500 mt-2">
            Global feed of all user feedback across all tenants.
          </p>
        </div>
        <div className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">
          Total: {feedbacks.length}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-zinc-300" size={40} />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-20 text-center">
          <MessageSquare className="mx-auto text-zinc-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-black">Platform is quiet</h3>
          <p className="text-zinc-500">
            No feedback has been submitted across the platform yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((item) => (
            <div
              key={item[DB.FEEDBACK.ID]}
              className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
                  <div className="bg-red-100 p-1.5 rounded-md text-red-600">
                    <User size={16} />
                  </div>
                  @
                  {item[DB.FEEDBACK.USERNAME] ||
                    item[DB.FEEDBACK.TELEGRAM_ID] ||
                    "Unknown User"}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] text-zinc-500 font-mono bg-zinc-100 px-2 py-1 rounded border border-zinc-200"
                    title="Tenant Admin ID"
                  >
                    Tenant: {item[DB.FEEDBACK.ADMIN_ID]?.substring(0, 8)}...
                  </span>
                  <span className="text-xs text-zinc-400 font-medium">
                    {new Date(item[DB.FEEDBACK.CREATED_AT]).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </span>
                </div>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 text-zinc-800 text-sm leading-relaxed whitespace-pre-wrap">
                {item[DB.FEEDBACK.MESSAGE]}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
