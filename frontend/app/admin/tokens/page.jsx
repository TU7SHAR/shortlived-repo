import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { KeyRound } from "lucide-react";
import TokensTable from "./TokensTable";

export default async function AdminTokensPage({ searchParams }) {
  const params = await searchParams;
  const filter = params.filter || "all"; // all, unused, used, revoked
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const perPage = 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Build query
  let query = supabaseAdmin
    .from("invite_tokens")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "unused") {
    query = query.eq("is_used", false).eq("is_revoked", false);
  } else if (filter === "used") {
    query = query.eq("is_used", true);
  } else if (filter === "revoked") {
    query = query.eq("is_revoked", true);
  }

  if (search) {
    query = query.or(
      `token_string.ilike.%${search}%,sent_to.ilike.%${search}%,caption.ilike.%${search}%`
    );
  }

  const { data: tokens, count: totalCount } = await query.range(from, to);

  // Stats
  const { count: totalTokens } = await supabaseAdmin
    .from("invite_tokens")
    .select("*", { count: "exact", head: true });
  const { count: usedCount } = await supabaseAdmin
    .from("invite_tokens")
    .select("*", { count: "exact", head: true })
    .eq("is_used", true);
  const { count: revokedCount } = await supabaseAdmin
    .from("invite_tokens")
    .select("*", { count: "exact", head: true })
    .eq("is_revoked", true);
  const availableCount = (totalTokens || 0) - (usedCount || 0) - (revokedCount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Invite Tokens
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage invite tokens across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">
              <span className="text-white font-bold">{totalTokens || 0}</span> total
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400">
              <span className="font-bold">{availableCount}</span> available
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-blue-400">
              <span className="font-bold">{usedCount || 0}</span> used
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="text-xs text-red-400">
              <span className="font-bold">{revokedCount || 0}</span> revoked
            </span>
          </div>
        </div>
      </div>

      <TokensTable
        tokens={tokens || []}
        totalCount={totalCount || 0}
        currentPage={page}
        perPage={perPage}
        currentSearch={search}
        currentFilter={filter}
      />
    </div>
  );
}
