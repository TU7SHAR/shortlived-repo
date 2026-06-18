import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  Zap,
  Users,
  BarChart3,
  TrendingUp,
  User,
  Activity,
} from "lucide-react";

export default async function ApiUsagePage() {
  // 1. Fetch all chat analytics to aggregate
  const { data: interactions } = await supabaseAdmin
    .from("chat_analytics")
    .select("telegram_id, created_at")
    .order("created_at", { ascending: false });

  // Fetch display names from onboarding_leads
  const { data: leads } = await supabaseAdmin
    .from("onboarding_leads")
    .select("telegram_id, full_name");

  const nameMap = {};
  if (leads) {
    leads.forEach((lead) => {
      if (lead.full_name) nameMap[lead.telegram_id] = lead.full_name;
    });
  }

  // 2. Aggregate Data in Javascript (The Engine)
  const totalRequests = interactions?.length || 0;

  // Group by User
  const userStats = {};
  interactions?.forEach((item) => {
    const id = item.telegram_id || "Unknown";
    if (!userStats[id]) {
      userStats[id] = {
        id,
        username: nameMap[id] || `User #${id}`,
        count: 0,
      };
    }
    userStats[id].count++;
  });

  // Sort to find "Heavy Hitters"
  const topUsers = Object.values(userStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const uniqueUsersCount = Object.keys(userStats).length;
  const avgRequests =
    uniqueUsersCount > 0 ? (totalRequests / uniqueUsersCount).toFixed(1) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-black tracking-tighter uppercase">
            API Usage Monitor
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Real-time breakdown of LLM requests and user consumption.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-black text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg">
            <Activity size={14} className="text-emerald-400" /> LIVE SYSTEM
            PULSE
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total API Requests"
          value={totalRequests.toLocaleString()}
          icon={<Zap size={24} />}
          description="Lifetime successful LLM cycles"
          color="bg-blue-600"
        />
        <StatCard
          title="Active API Users"
          value={uniqueUsersCount}
          icon={<Users size={24} />}
          description="Unique entities interacting with Bot"
          color="bg-zinc-900"
        />
        <StatCard
          title="Avg Load / User"
          value={avgRequests}
          icon={<TrendingUp size={24} />}
          description="Average requests per session"
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* HEAVY HITTERS TABLE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-2">
            <BarChart3 size={18} className="text-zinc-400" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Top 10 Heavy Hitters
            </h2>
          </div>
          <div className="bg-white border border-zinc-200 rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-400 font-black text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-4">User Identity</th>
                  <th className="px-8 py-4 text-center">API Calls</th>
                  <th className="px-8 py-4 text-right">System Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {topUsers.map((user, idx) => {
                  const percentage = (
                    (user.count / totalRequests) *
                    100
                  ).toFixed(1);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="font-bold text-black flex items-center gap-2">
                          <span className="text-zinc-300 italic">
                            #{idx + 1}
                          </span>
                          @{user.username}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          ID: {user.id}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="bg-zinc-100 px-3 py-1 rounded-lg font-black text-black tabular-nums">
                          {user.count}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden mt-1 inline-block w-24 align-middle mr-2">
                          <div
                            className="bg-black h-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-zinc-400">
                          {percentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RECENT LOAD TIPS */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 p-8 rounded-[2.5rem] shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
              Usage Insights
            </h3>
            <div className="space-y-6">
              <InsightItem
                label="Peak User"
                value={`@${topUsers[0]?.username || "N/A"}`}
                sub={`${topUsers[0]?.count || 0} requests`}
              />
              <InsightItem
                label="System Status"
                value={totalRequests > 1000 ? "High Load" : "Nominal"}
                sub="Requests within 24hr window"
              />
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-700">
                <p className="text-[11px] font-bold leading-relaxed">
                  <strong>Pro-Tip:</strong> High API usage by a single user
                  might indicate botting or token scraping. Monitor the Heavy
                  Hitters list daily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, description, color }) {
  return (
    <div
      className={`${color} text-white p-8 rounded-[2.5rem] shadow-xl space-y-4`}
    >
      <div className="opacity-60">{icon}</div>
      <div>
        <div className="text-4xl font-black tracking-tighter tabular-nums">
          {value}
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mt-1">
          {title}
        </div>
      </div>
      <p className="text-[11px] font-medium opacity-50 border-t border-white/10 pt-4">
        {description}
      </p>
    </div>
  );
}

function InsightItem({ label, value, sub }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
        {label}
      </p>
      <p className="text-lg font-bold text-black">{value}</p>
      <p className="text-[10px] text-zinc-400 font-bold uppercase">{sub}</p>
    </div>
  );
}
