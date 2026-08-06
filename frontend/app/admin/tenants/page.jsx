import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Building2 } from "lucide-react";
import TenantsTable from "./TenantsTable";

export default async function AdminTenantsPage() {
  // Fetch all unique admin_ids from invite_tokens (these are the tenants)
  const { data: tokensRaw } = await supabaseAdmin
    .from("invite_tokens")
    .select("admin_id, created_at");

  // Get unique admin IDs
  const adminIds = [...new Set(tokensRaw?.map((t) => t.admin_id).filter(Boolean))];

  // Fetch bot_settings for each tenant
  const { data: settingsData } = await supabaseAdmin
    .from("bot_settings")
    .select("admin_id, maintenance_mode, strict_knowledge_mode, temperature, updated_at");

  // Fetch file counts per admin
  const { data: filesData } = await supabaseAdmin
    .from("ingested_files")
    .select("admin_id");

  // Fetch user counts per admin
  const { data: usersData } = await supabaseAdmin
    .from("authorized_users")
    .select("admin_id");

  // Fetch chat counts per admin
  const { data: chatsData } = await supabaseAdmin
    .from("chat_analytics")
    .select("admin_id");

  // Fetch token counts per admin
  const { data: allTokens } = await supabaseAdmin
    .from("invite_tokens")
    .select("admin_id, is_used, is_revoked");

  // Build tenant profiles
  const tenants = adminIds.map((adminId) => {
    const settings = settingsData?.find((s) => s.admin_id === adminId) || {};
    const fileCount = filesData?.filter((f) => f.admin_id === adminId).length || 0;
    const userCount = usersData?.filter((u) => u.admin_id === adminId).length || 0;
    const chatCount = chatsData?.filter((c) => c.admin_id === adminId).length || 0;
    const tenantTokens = allTokens?.filter((t) => t.admin_id === adminId) || [];
    const tokenCount = tenantTokens.length;
    const usedTokenCount = tenantTokens.filter((t) => t.is_used).length;

    // Find earliest token to determine tenant creation date
    const tenantCreated = tokensRaw
      ?.filter((t) => t.admin_id === adminId)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0]?.created_at;

    return {
      admin_id: adminId,
      maintenance_mode: settings.maintenance_mode || false,
      strict_knowledge_mode: settings.strict_knowledge_mode ?? true,
      temperature: settings.temperature ?? 0.2,
      settings_updated_at: settings.updated_at,
      file_count: fileCount,
      user_count: userCount,
      chat_count: chatCount,
      token_count: tokenCount,
      used_token_count: usedTokenCount,
      created_at: tenantCreated,
    };
  });

  // Sort by user count (most active first)
  tenants.sort((a, b) => b.user_count - a.user_count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tenants
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Manage tenant admins, their usage, and configuration.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <span className="text-xs text-zinc-400">
            <span className="text-white font-bold">{tenants.length}</span> active tenants
          </span>
        </div>
      </div>

      <TenantsTable tenants={tenants} />
    </div>
  );
}
