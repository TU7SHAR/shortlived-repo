import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Database } from "lucide-react";
import KnowledgeTable from "./KnowledgeTable";

export default async function AdminKnowledgePage({ searchParams }) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";
  const page = parseInt(params.page || "1");
  const perPage = 25;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Build query
  let query = supabaseAdmin
    .from("ingested_files")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("filename", `%${search}%`);
  }

  const { data: files, count: totalCount } = await query.range(from, to);

  // Stats
  const { count: totalFiles } = await supabaseAdmin
    .from("ingested_files")
    .select("*", { count: "exact", head: true });

  const { count: completedFiles } = await supabaseAdmin
    .from("ingested_files")
    .select("*", { count: "exact", head: true })
    .eq("condensation_status", "completed");

  const { count: pendingFiles } = await supabaseAdmin
    .from("ingested_files")
    .select("*", { count: "exact", head: true })
    .eq("condensation_status", "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Knowledge Base
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            View and manage ingested files across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <span className="text-xs text-zinc-400">
              <span className="text-white font-bold">{totalFiles || 0}</span> files
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-xs text-emerald-400">
              <span className="font-bold">{completedFiles || 0}</span> processed
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-xs text-amber-400">
              <span className="font-bold">{pendingFiles || 0}</span> pending
            </span>
          </div>
        </div>
      </div>

      <KnowledgeTable
        files={files || []}
        totalCount={totalCount || 0}
        currentPage={page}
        perPage={perPage}
        currentSearch={search}
        currentCategory={category}
      />
    </div>
  );
}
