export const dynamic = "force-dynamic";

import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Settings } from "lucide-react";
import SettingsPanel from "./SettingsPanel";

export default async function AdminSettingsPage() {
  // Fetch all bot_settings
  const { data: settings } = await supabaseAdmin
    .from("bot_settings")
    .select("admin_id, maintenance_mode, strict_knowledge_mode, temperature, updated_at")
    .order("updated_at", { ascending: false });

  // Determine global maintenance status (all tenants in maintenance = global is on)
  const allInMaintenance =
    settings && settings.length > 0 && settings.every((s) => s.maintenance_mode);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings
        </h1>
        <p className="text-zinc-500 text-sm mt-1">
          Global system configuration, maintenance controls, and data management.
        </p>
      </div>

      <SettingsPanel
        tenantSettings={settings || []}
        globalMaintenance={allInMaintenance}
      />
    </div>
  );
}
