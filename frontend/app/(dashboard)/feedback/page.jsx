"use client";

import { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Loader2,
  User,
  HeartHandshake,
  CalendarRange,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function TenantFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Feedback | ${siteConfig.name}`;
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from(DB.FEEDBACK.TABLE)
      .select("*")
      .eq(DB.FEEDBACK.ADMIN_ID, user.id)
      .order(DB.FEEDBACK.CREATED_AT, { ascending: false });

    if (!error && data) {
      setFeedbacks(data);
    }
    setLoading(false);
  };

  // Compute live review summary cards statistics dynamically
  const stats = useMemo(() => {
    const total = feedbacks.length;

    // Filter out rows submitted in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thisWeek = feedbacks.filter(
      (f) => new Date(f[DB.FEEDBACK.CREATED_AT]) >= sevenDaysAgo,
    ).length;

    // Count user submissions that contain a fallback string or profile username
    const namedUsers = feedbacks.filter((f) => f[DB.FEEDBACK.USERNAME]).length;

    return { total, thisWeek, namedUsers };
  }, [feedbacks]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Retrieving user response streams...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
      {/* Upper Content Header Frame */}
      <div>
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
            <MessageSquare size={22} className="text-primary" />
          </div>
          Bot Feedback
        </h1>
        <p className="text-[0.95rem] text-grey-500 mt-1">
          View direct feedback, reviews, and feature requests submitted by your
          Telegram bot users.
        </p>
      </div>

      {/* Balanced Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-primary-light text-primary rounded-[12px] shrink-0">
            <HeartHandshake size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Total Feedback Logs
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-[#F0FDF4] text-[#16a34a] rounded-[12px] shrink-0">
            <CalendarRange size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Received This Week
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.thisWeek}
            </p>
          </div>
        </div>
      </div>

      {/* Main Feedback Dynamic List Container */}
      <div className="w-full">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-grey-100 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-grey-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-grey-100">
              <MessageSquare className="text-grey-300" size={28} />
            </div>
            <h3 className="text-[1.1rem] font-bold text-navy font-display mb-1">
              No telemetry submissions yet
            </h3>
            <p className="text-[0.95rem] text-grey-500 max-w-sm mx-auto leading-relaxed">
              When end-users execute the{" "}
              <code className="bg-grey-50 border border-grey-100 px-1.5 py-0.5 rounded-md font-mono text-grey-700 font-bold text-xs">
                /feedback
              </code>{" "}
              parameter sequence in the bot, responses will register here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 w-full">
            {feedbacks.map((item) => (
              <div
                key={item[DB.FEEDBACK.ID]}
                className="bg-white p-5 md:p-6 rounded-[16px] border border-grey-100 shadow-sm flex flex-col gap-4 transition-colors hover:border-grey-300"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 text-sm font-semibold text-navy min-w-0">
                    <div className="w-10 h-10 bg-grey-50 border border-grey-100 rounded-[10px] text-primary flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>
                    <span className="truncate font-display font-bold text-[1.05rem]">
                      @
                      {item[DB.FEEDBACK.USERNAME] ||
                        item[DB.FEEDBACK.TELEGRAM_ID] ||
                        "anonymous_user"}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-grey-500 bg-grey-50 border border-grey-100 px-3 py-1.5 rounded-md shrink-0">
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

                <div className="bg-grey-50/50 p-4 sm:p-5 rounded-[12px] border border-grey-100 text-navy text-[0.95rem] leading-relaxed whitespace-pre-wrap select-text font-medium">
                  {item[DB.FEEDBACK.MESSAGE]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
