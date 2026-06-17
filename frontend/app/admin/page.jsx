import { supabaseAdmin } from "../lib/supabaseAdmin";
import { Users, KeyRound, Ticket, ShieldCheck, Activity } from "lucide-react";
import DashboardChart from "./components/DashboardChart";
import DateFilter from "./components/DateFilter";
import TablePagination from "./components/TablePagination";

export default async function AdminDashboard({ searchParams }) {
  const params = await searchParams;

  let startDate, endDate;
  let chartTitle = "New Users";

  if (params.start && params.end) {
    startDate = new Date(params.start);
    endDate = new Date(params.end);
    endDate.setHours(23, 59, 59, 999);
    chartTitle = `New Users (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})`;
  } else {
    const days = parseInt(params.days || "7");
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    chartTitle = `New Users (Last ${days} Days)`;
  }

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const page = parseInt(params.page || "1");
  const ITEMS_PER_PAGE = 5;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const [
    { count: totalUsers },
    { data: tokensData },
    { data: paginatedUsers, count: totalUsersCount },
    { data: paginatedTokens, count: totalTokensCount },
    { data: graphRawData },
  ] = await Promise.all([
    supabaseAdmin
      .from("authorized_users")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin.from("invite_tokens").select("id, is_used"),
    supabaseAdmin
      .from("authorized_users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabaseAdmin
      .from("invite_tokens")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to),
    supabaseAdmin
      .from("authorized_users")
      .select("created_at")
      .gte("created_at", startIso)
      .lte("created_at", endIso),
  ]);

  const totalTokens = tokensData?.length || 0;
  const usedTokens = tokensData?.filter((t) => t.is_used).length || 0;
  const activeTokens = totalTokens - usedTokens;
  const usagePercentage =
    totalTokens > 0 ? Math.round((usedTokens / totalTokens) * 100) : 0;

  const timeDiff = endDate.getTime() - startDate.getTime();
  const totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const timelineDays = [...Array(totalDays > 0 ? totalDays : 1)]
    .map((_, i) => {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    })
    .reverse();

  const chartData = timelineDays.map((date) => {
    const usersOnDate =
      graphRawData?.filter((u) => u.created_at.startsWith(date)).length || 0;
    return {
      date: new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      users: usersOnDate,
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-black text-white rounded-xl shadow-md shrink-0">
            <Activity size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
              System Overview
            </h1>
            <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-0.5 sm:mt-1">
              Growth analytics and access management.
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto overflow-x-auto flex sm:justify-end">
          <DateFilter />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <BigStatCard
          title="Total Authorized"
          value={totalUsers || 0}
          icon={
            <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
          }
          colorClass="bg-blue-50 text-blue-600"
        />
        <BigStatCard
          title="Total Tokens"
          value={totalTokens}
          icon={<Ticket className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />}
          colorClass="bg-purple-50 text-purple-600"
        />
        <BigStatCard
          title="Used Tokens"
          value={usedTokens}
          icon={<Users className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />}
          colorClass="bg-orange-50 text-orange-600"
        />
        <BigStatCard
          title="Available Tokens"
          value={activeTokens}
          icon={<KeyRound className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />}
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <h3 className="text-base sm:text-lg font-bold text-black tracking-tight mb-4">
            {chartTitle}
          </h3>
          <div className="w-full overflow-x-auto">
            <DashboardChart data={chartData} />
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col justify-center">
          <h3 className="text-base sm:text-lg font-bold text-black tracking-tight mb-4 sm:mb-6">
            Global Token Usage
          </h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl sm:text-5xl font-black text-black tracking-tighter">
              {usagePercentage}%
            </span>
            <span className="text-zinc-500 text-xs sm:text-sm font-medium pb-1">
              Consumed
            </span>
          </div>
          <div className="w-full h-3 sm:h-4 bg-zinc-100 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-black rounded-full transition-all duration-1000"
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
              <span className="text-zinc-500 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-black"></div> Used
              </span>
              <span className="text-black font-semibold">{usedTokens}</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
              <span className="text-zinc-500 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>{" "}
                Available
              </span>
              <span className="text-black font-semibold">{activeTokens}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-black tracking-tight mb-4">
              Authorized Users List
            </h3>
            <div className="overflow-x-auto min-h-[300px] -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="border-b-2 border-zinc-100">
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs">
                      Telegram ID
                    </th>
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs">
                      Token Used
                    </th>
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers?.map((user) => (
                    <tr
                      key={user.telegram_id}
                      className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="py-3 sm:py-4 px-2 font-mono text-xs sm:text-sm text-black font-semibold">
                        {user.telegram_id}
                      </td>
                      <td className="py-3 sm:py-4 px-2 text-[11px] sm:text-xs text-zinc-500 font-mono truncate max-w-[120px]">
                        {user.token_id || "N/A"}
                      </td>
                      <td className="py-3 sm:py-4 px-2 text-right">
                        <span
                          className={`px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${user.is_banned ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                        >
                          {user.is_banned ? "Banned" : "Active"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <TablePagination
              totalItems={totalUsersCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="Users"
            />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-black tracking-tight mb-4">
              Generated Tokens
            </h3>
            <div className="overflow-x-auto min-h-[300px] -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left border-collapse min-w-[450px]">
                <thead>
                  <tr className="border-b-2 border-zinc-100">
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs">
                      Token String
                    </th>
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs">
                      Type / To
                    </th>
                    <th className="pb-3 px-2 font-bold text-zinc-400 uppercase tracking-wider text-[10px] sm:text-xs text-right">
                      State
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTokens?.map((token) => (
                    <tr
                      key={token.id}
                      className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors"
                    >
                      <td className="py-3 sm:py-4 px-2 font-mono text-[11px] sm:text-xs text-black font-semibold truncate max-w-[120px]">
                        {token.token_string}
                      </td>
                      <td className="py-3 sm:py-4 px-2">
                        <div className="text-xs sm:text-sm font-medium text-black capitalize">
                          {token.token_type || "Normal"}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-2 text-right">
                        <span
                          className={`px-2 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${token.is_used ? "bg-zinc-100 text-zinc-500" : "bg-blue-100 text-blue-700"}`}
                        >
                          {token.is_used ? "Used" : "Unused"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <TablePagination
              totalItems={totalTokensCount || 0}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="Tokens"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function BigStatCard({ title, value, icon, colorClass }) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-zinc-200 flex items-center gap-4 w-full">
      <div
        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">
          {title}
        </h3>
        <div className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}
