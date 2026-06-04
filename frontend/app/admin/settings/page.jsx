import { supabaseAdmin } from "../../lib/supabaseAdmin";
import MaintenanceSwitch from "../../admin/components/MaintainenceSwitch";
import { Settings } from "lucide-react";

export default async function BotSettingsPage() {
  // Fetch the master setting row
  const { data: settings } = await supabaseAdmin
    .from("bot_settings")
    .select("*")
    .eq("id", 1)
    .single();

  // Default to false if the database row hasn't been created yet
  const isMaintenance = settings?.maintenance_mode || false;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
        <div className="p-3 bg-black text-white rounded-xl shadow-lg shrink-0">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">
            System Core
          </h1>
          <p className="text-zinc-500 text-sm font-medium mt-1">
            Global configuration and emergency controls.
          </p>
        </div>
      </div>

      {/* The Master Control UI */}
      <MaintenanceSwitch initialStatus={isMaintenance} />
    </div>
  );
}
