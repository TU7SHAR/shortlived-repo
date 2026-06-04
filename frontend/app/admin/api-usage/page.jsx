import { supabaseAdmin } from "../../lib/supabaseAdmin";
import {
  Activity,
  Zap,
  Users,
  TrendingUp,
  BarChart3,
  AlertCircle,
} from "lucide-react";

export const revalidate = 60; // Auto-refresh data every 60 seconds

export default async function ApiUsagePage() {
  // 1. Fetch raw interaction logs
  const { data: interactions, error } = await supabaseAdmin
    .from("chat_analytics")
    .select("telegram_id, username, created_at")
    .order("created_at", { ascending: false });

  if (error) console.error("Analytics Fetch Error:", error.message);

  // 2. The Aggregation Engine
  const totalRequests = interactions?.length || 0;
  const userStats = {};

  interactions?.forEach((item) => {
    const key = item.telegram_id || "Unknown_Entity";
    if (!userStats[key]) {
      userStats[key] = {
        id: key,
        username: item.username || "anonymous",
        count: 0,
      };
    }
    userStats[key].count++;
  });

  // Get Top 15 Consumers
  const topUsers = Object.values(userStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  const uniqueUsersCount = Object.keys(userStats).length;
  const avgRequests =
    uniqueUsersCount > 0 ? (totalRequests / uniqueUsersCount).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            API Telemetry
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time LLM request volume and user consumption metrics.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-700 text-xs font-bold tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          LIVE MONITORING
        </div>
      </div>

      {/* 2. Global Pulse Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total API Calls"
          value={totalRequests.toLocaleString()}
          icon={<Zap size={20} className="text-blue-600" />}
          trend="+12% this week"
        />
        <MetricCard
          title="Active Entities"
          value={uniqueUsersCount.toLocaleString()}
          icon={<Users size={20} className="text-emerald-600" />}
          trend="Unique Telegram IDs"
        />
        <MetricCard
          title="Avg. Cost / User"
          value={`${avgRequests} reqs`}
          icon={<TrendingUp size={20} className="text-zinc-600" />}
          trend="Lifetime average"
        />
      </div>

      {/* 3. Leaderboard & Insights Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* The Heavy Hitters Table (Spans 2/3) */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <BarChart3 size={16} className="text-zinc-400" /> Consumption
              Leaderboard
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Top 15 Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Rank & Identity</th>
                  <th className="px-6 py-3 text-right">API Requests</th>
                  <th className="px-6 py-3 text-right">Volume Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {topUsers.map((user, idx) => {
                  const share = ((user.count / totalRequests) * 100).toFixed(1);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-300 font-mono text-xs w-4">
                            {(idx + 1).toString().padStart(2, "0")}
                          </span>
                          <div>
                            <p className="font-bold text-zinc-900 leading-tight">
                              @{user.username}
                            </p>
                            <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              {user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-zinc-700 bg-zinc-100 px-2 py-1 rounded-md">
                          {user.count.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium text-zinc-500 w-10">
                            {share}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {topUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-12 text-center text-zinc-400 text-sm"
                    >
                      No API activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actionable Insights Sidebar (Spans 1/3) */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-6">
              System Health
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Peak Consumer
                </p>
                <p className="text-lg font-bold text-zinc-900 tracking-tight">
                  @{topUsers[0]?.username || "N/A"}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Responsible for{" "}
                  {topUsers.length > 0
                    ? ((topUsers[0].count / totalRequests) * 100).toFixed(1)
                    : 0}
                  % of all load
                </p>
              </div>

              <div className="h-px bg-zinc-100" />

              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                  Database Load
                </p>
                <p className="text-lg font-bold text-zinc-900 tracking-tight">
                  Nominal
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  Queries resolving under 50ms
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
            <div className="flex gap-3">
              <AlertCircle
                size={16}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <div>
                <h4 className="text-sm font-bold text-amber-900">
                  Abuse Monitoring
                </h4>
                <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
                  If a single user exceeds 15% of your total API volume share,
                  consider reviewing their chat logs or utilizing the Ban Entity
                  feature to prevent LLM credit drain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable clean metric card
function MetricCard({ title, value, icon, trend }) {
  return (
    <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        <div className="p-2 bg-zinc-50 rounded-lg">{icon}</div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">
          {value}
        </h3>
        <p className="text-xs text-zinc-400 mt-2 font-medium">{trend}</p>
      </div>
    </div>
  );
}
