import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Users } from "lucide-react";
import UsersTable from "./UsersTable";

export default async function AdminUsersPage({ searchParams }) {
  const params = await searchParams;
  const filter = params.filter || "all"; // all, active, banned
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = 20;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Build query
  let query = supabaseAdmin
    .from("authorized_users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "active") {
    query = query.eq("is_banned", false);
  } else if (filter === "banned") {
    query = query.eq("is_banned", true);
  }

  if (search) {
    query = query.or(
      `telegram_id.eq.${isNaN(search) ? 0 : search},username.ilike.%${search}%`
    );
  }

  const { data: users, count: totalCount } = await query.range(from, to);

  // Fetch onboarding data for enrichment
  const telegramIds = users?.map((u) => u.telegram_id) || [];
  let onboardingData = [];
  if (telegramIds.length > 0) {
    const { data } = await supabaseAdmin
      .from("onboarding_leads")
      .select("telegram_id, full_name, phone_number, experience_level, role, goal")
      .in("telegram_id", telegramIds);
    onboardingData = data || [];
  }

  // Merge onboarding info
  const enrichedUsers = (users || []).map((user) => ({
    ...user,
    onboarding: onboardingData.find(
      (o) => String(o.telegram_id) === String(user.telegram_id)
    ) || null,
  }));

  // Stats
  const { count: totalAll } = await supabaseAdmin
    .from("authorized_users")
    .select("*", { count: "exact", head: true });
  const { count: totalBanned } = await supabaseAdmin
    .from("authorized_users")
    .select("*", { count: "exact", head: true })
    .eq("is_banned", true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Bot Users
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage authorized Telegram users across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">
              <span className="text-white font-bold">{totalAll || 0}</span> total
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-xs text-red-400">
              <span className="font-bold">{totalBanned || 0}</span> banned
            </span>
          </div>
        </div>
      </div>

      {/* Client Component with search, filters, and actions */}
      <UsersTable
        initialUsers={enrichedUsers}
        totalCount={totalCount || 0}
        currentPage={page}
        perPage={perPage}
        currentFilter={filter}
        currentSearch={search}
      />
    </div>
  );
}
