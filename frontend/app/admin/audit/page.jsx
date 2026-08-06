import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { ScrollText } from "lucide-react";
import AuditLog from "./AuditLog";

export default async function AdminAuditPage({ searchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const actionFilter = params.action || "";
  const page = parseInt(params.page || "1");
  const perPage = 40;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Build query
  let query = supabaseAdmin
    .from("super_admin_audit_logs")
    .select("*", { count: "exact" })
    .order("performed_at", { ascending: false });

  if (actionFilter && actionFilter !== "all") {
    query = query.eq("action", actionFilter);
  }

  if (search) {
    query = query.or(
      `action.ilike.%${search}%,entity_type.ilike.%${search}%,entity_id.ilike.%${search}%`
    );
  }

  const { data: logs, count: totalCount } = await query.range(from, to);

  // Get unique action types for filter
  const { data: actionTypes } = await supabaseAdmin
    .from("super_admin_audit_logs")
    .select("action")
    .order("action");

  const uniqueActions = [...new Set(actionTypes?.map((a) => a.action) || [])];

  // Stats
  const { count: totalLogs } = await supabaseAdmin
    .from("super_admin_audit_logs")
    .select("*", { count: "exact", head: true });

  // Today's count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabaseAdmin
    .from("super_admin_audit_logs")
    .select("*", { count: "exact", head: true })
    .gte("performed_at", today.toISOString());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Audit Log
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Complete trail of all super admin actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">
              <span className="text-white font-bold">{totalLogs || 0}</span> total events
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <span className="text-xs text-blue-400">
              <span className="font-bold">{todayCount || 0}</span> today
            </span>
          </div>
        </div>
      </div>

      <AuditLog
        logs={logs || []}
        totalCount={totalCount || 0}
        currentPage={page}
        perPage={perPage}
        currentSearch={search}
        currentAction={actionFilter}
        actionTypes={uniqueActions}
      />
    </div>
  );
}
