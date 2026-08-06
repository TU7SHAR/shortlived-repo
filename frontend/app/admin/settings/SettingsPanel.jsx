"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Power,
  PowerOff,
  AlertTriangle,
  Trash2,
  Shield,
  Clock,
} from "lucide-react";
import {
  setGlobalMaintenance,
  toggleMaintenanceMode,
  purgeOldAnalytics,
} from "../../actions/adminAuth";

export default function SettingsPanel({ tenantSettings, globalMaintenance }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState(null);
  const [purgeResult, setPurgeResult] = useState(null);
  const [purgeDays, setPurgeDays] = useState(90);

  const handleGlobalMaintenance = async (enabled) => {
    if (
      !confirm(
        enabled
          ? "This will put ALL tenants into maintenance mode. The bot will stop responding to all users. Continue?"
          : "This will disable maintenance mode for ALL tenants. Continue?"
      )
    )
      return;

    setActionLoading("global");
    const result = await setGlobalMaintenance(enabled);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleTenantMaintenance = async (adminId, currentStatus) => {
    setActionLoading(adminId);
    const result = await toggleMaintenanceMode(adminId, !currentStatus);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handlePurge = async () => {
    if (
      !confirm(
        `Permanently delete all chat analytics older than ${purgeDays} days? This cannot be undone.`
      )
    )
      return;

    setActionLoading("purge");
    const result = await purgeOldAnalytics(purgeDays);
    if (result.success) {
      setPurgeResult(`Deleted ${result.deleted} records.`);
      setTimeout(() => setPurgeResult(null), 5000);
    }
    setActionLoading(null);
  };

  return (
    <div className={`space-y-6 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Global Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield size={14} className="text-zinc-500" />
            Global Controls
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Emergency controls that affect the entire platform.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Global Maintenance Toggle */}
          <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Global Maintenance Mode
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {globalMaintenance
                  ? "Bot is currently in maintenance mode for ALL tenants."
                  : "Bot is running normally. Toggle to shut down all tenants."}
              </p>
            </div>
            <button
              onClick={() => handleGlobalMaintenance(!globalMaintenance)}
              disabled={actionLoading === "global"}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                globalMaintenance
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
              }`}
            >
              {globalMaintenance ? (
                <>
                  <Power size={14} />
                  Bring Online
                </>
              ) : (
                <>
                  <PowerOff size={14} />
                  Shutdown All
                </>
              )}
            </button>
          </div>

          {globalMaintenance && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={14} className="text-amber-400 shrink-0" />
              <p className="text-xs text-amber-400">
                All bots are currently offline. Users will see a maintenance
                message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Per-Tenant Maintenance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Power size={14} className="text-zinc-500" />
            Per-Tenant Maintenance
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Toggle maintenance mode for individual tenants.
          </p>
        </div>
        <div className="divide-y divide-zinc-800/50">
          {tenantSettings.map((tenant) => (
            <div
              key={tenant.admin_id}
              className="px-6 py-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    tenant.maintenance_mode ? "bg-amber-400" : "bg-emerald-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-white font-mono truncate max-w-[250px]">
                    {tenant.admin_id}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    Temp: {tenant.temperature} | Strict:{" "}
                    {tenant.strict_knowledge_mode ? "On" : "Off"}
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleTenantMaintenance(tenant.admin_id, tenant.maintenance_mode)
                }
                disabled={actionLoading === tenant.admin_id}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${
                  tenant.maintenance_mode
                    ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                {tenant.maintenance_mode ? "Bring Online" : "Maintenance"}
              </button>
            </div>
          ))}
          {tenantSettings.length === 0 && (
            <div className="px-6 py-8 text-center">
              <p className="text-zinc-600 text-sm">No tenant settings found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Trash2 size={14} className="text-zinc-500" />
            Data Management
          </h2>
          <p className="text-xs text-zinc-600 mt-1">
            Purge old data to free storage and improve performance.
          </p>
        </div>
        <div className="p-6 space-y-4">
          {/* Purge Analytics */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-800/50 rounded-lg">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={13} className="text-zinc-500" />
                Purge Old Chat Analytics
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Delete chat_analytics records older than the specified days.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={purgeDays}
                onChange={(e) => setPurgeDays(parseInt(e.target.value))}
                className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
              </select>
              <button
                onClick={handlePurge}
                disabled={actionLoading === "purge"}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Purge
              </button>
            </div>
          </div>

          {purgeResult && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-emerald-400">{purgeResult}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
