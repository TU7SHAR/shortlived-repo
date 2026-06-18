"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Activity,
  MessageSquare,
  Database,
  Coins,
  Server,
  ShieldAlert,
  Loader2,
  UserCheck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { llmPricing } from "../../utils/config";
import { useSubscription } from "../../context/SubscriptionContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function ApiUsagePage() {
  const [stats, setStats] = useState({
    totalQueries: 0,
    totalTokens: 0,
    estimatedCost: 0,
  });
  const { activePlan } = useSubscription() || {};
  const [chartData, setChartData] = useState([]);
  const [userTable, setUserTable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `API Usage | ${siteConfig.name}`;
    async function fetchUsage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: chats, error } = await supabase
        .from("chat_analytics")
        .select("telegram_id, user_query, bot_response, created_at")
        .eq("admin_id", user.id);

      if (!error && chats) {
        let totalCents = 0;
        let totalT = 0;
        const dateMap = {};
        const userMap = {};

        const today = new Date();
        for (let i = 13; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          dateMap[
            d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          ] = { tokens: 0, queries: 0 };
        }

        chats.forEach((chat) => {
          const inputChars = chat.user_query ? chat.user_query.length : 0;
          const outputChars = chat.bot_response ? chat.bot_response.length : 0;
          const inputTokens = inputChars / 4;
          const outputTokens = outputChars / 4;
          const totalInteractionTokens = inputTokens + outputTokens;
          totalT += totalInteractionTokens;

          const queryCost =
            (inputTokens / 1000000) * llmPricing.INPUT_PRICE +
            (outputTokens / 1000000) * llmPricing.OUTPUT_PRICE;
          totalCents += queryCost;

          const dateStr = new Date(chat.created_at).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" },
          );
          if (dateMap[dateStr]) {
            dateMap[dateStr].tokens += totalInteractionTokens;
            dateMap[dateStr].queries += 1;
          }

          if (!userMap[chat.telegram_id]) {
            userMap[chat.telegram_id] = {
              id: chat.telegram_id,
              username: `User #${chat.telegram_id}`,
              queries: 0,
              tokens: 0,
            };
          }
          userMap[chat.telegram_id].queries += 1;
          userMap[chat.telegram_id].tokens += totalInteractionTokens;
        });

        setStats({
          totalQueries: chats.length,
          totalTokens: Math.round(totalT),
          estimatedCost: totalCents,
        });
        setChartData(
          Object.keys(dateMap).map((key) => ({
            name: key,
            Tokens: Math.round(dateMap[key].tokens),
            Queries: dateMap[key].queries,
          })),
        );
        setUserTable(
          Object.values(userMap).sort((a, b) => b.queries - a.queries),
        );
      }
      setLoading(false);
    }
    fetchUsage();
  }, []);

  const derivedStats = useMemo(() => {
    const avgTokensPerQuery =
      stats.totalQueries > 0
        ? Math.round(stats.totalTokens / stats.totalQueries)
        : 0;
    const quotaLimit = activePlan?.limits?.apiQueriesPerMonth || 10000;
    const utilizationRate = Math.min(
      Math.round((stats.totalQueries / quotaLimit) * 100),
      100,
    );

    return { avgTokensPerQuery, utilizationRate, quotaLimit };
  }, [stats, activePlan]);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Compiling API utilization vectors...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
      {/* Upper Information Header Grid */}
      <div className="flex flex-col sm:flex-row gap-5 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
              <Activity size={22} className="text-primary" />
            </div>
            Developer API Usage
          </h1>
          <p className="text-[0.95rem] text-grey-500 mt-1">
            Monitor raw token consumption, compute volume frequencies, and
            underlying LLM infrastructure expenditures.
          </p>
        </div>

        {/* Dynamic Subscription Token Capacity Badge */}
        <div className="bg-grey-50 border border-grey-100 px-5 py-3 rounded-[12px] flex flex-col items-end shrink-0 shadow-sm">
          <span className="text-[10px] font-bold text-grey-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert size={12} className="text-grey-500" /> Subscription
            Limit
          </span>
          <span className="text-sm font-bold text-navy mt-1 font-display tracking-wide">
            {stats.totalQueries.toLocaleString()} /{" "}
            {derivedStats.quotaLimit.toLocaleString()} QM
          </span>
        </div>
      </div>

      {/* High Density Metric Cards Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-primary-light text-primary rounded-[12px] shrink-0">
            <MessageSquare size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Total Queries
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.totalQueries.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-[#F0FDF4] text-[#16a34a] rounded-[12px] shrink-0">
            <Database size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Tokens Loaded
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.totalTokens.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-[12px] shrink-0">
            <Coins size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Compute Cost
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              ${stats.estimatedCost.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Chart Panel Box Layout */}
      <div className="bg-white border border-grey-100 p-5 sm:p-6 rounded-[16px] shadow-sm">
        <h3 className="text-xs font-bold text-grey-400 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity size={16} className="text-grey-500" /> Token Volume &
          Analytics Trend (Last 14 Days)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <defs>
                {/* Updated gradient to use the Salesji Primary Blue */}
                <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F1F5F9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E2E8F0",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#0F172A",
                  boxShadow: "0 4px 24px rgba(10,22,40,0.10)",
                }}
              />
              <Area
                type="monotone"
                dataKey="Tokens"
                stroke="#1D4ED8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#tokenGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Identity Table Section Container */}
      <div className="bg-white rounded-[16px] border border-grey-100 shadow-sm overflow-hidden p-2">
        <div className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-grey-400 border-b border-grey-50 mb-1 flex items-center gap-2">
          <Server size={14} /> Usage Attribution by Telegram Identity
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-grey-50 border-b border-grey-100 text-xs uppercase tracking-wider text-grey-500 font-bold">
                <th className="px-6 py-4 w-1/2">Telegram User / Handles</th>
                <th className="px-6 py-4 text-center w-1/4">
                  Queries Transmitted
                </th>
                <th className="px-6 py-4 text-right w-1/4">
                  Aggregate Tokens Consumed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grey-100 text-sm">
              {userTable.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="text-center py-12 text-grey-400 text-sm font-medium"
                  >
                    No recorded endpoint execution logs identified.
                  </td>
                </tr>
              ) : (
                userTable.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-grey-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold font-display text-navy text-[0.95rem] flex items-center gap-1.5">
                          <UserCheck size={14} className="text-primary/70" /> @
                          {user.username}
                        </span>
                        <span className="text-[10px] text-grey-400 font-mono mt-1 font-semibold tracking-wide">
                          Profile ID: {user.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-navy text-[1rem]">
                      {user.queries.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="bg-grey-50 border border-grey-100 text-navy px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide">
                        {Math.round(user.tokens).toLocaleString()}
                      </span>
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
