"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Database,
  MessageSquare,
  KeyRound,
  AlertTriangle,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from "lucide-react";
import { toggleMaintenanceMode } from "../../actions/adminAuth";

export default function TenantsTable({ tenants }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedTenant, setExpandedTenant] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleToggleMaintenance = async (adminId, currentStatus) => {
    setActionLoading(adminId);
    const result = await toggleMaintenanceMode(adminId, !currentStatus);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const copyAdminId = (adminId) => {
    navigator.clipboard.writeText(adminId);
    setCopied(adminId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={`space-y-3 ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      {tenants.map((tenant) => {
        const isExpanded = expandedTenant === tenant.admin_id;

        return (
          <div
            key={tenant.admin_id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all"
          >
            {/* Row */}
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
              onClick={() =>
                setExpandedTenant(isExpanded ? null : tenant.admin_id)
              }
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-zinc-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-white truncate max-w-[200px] sm:max-w-[300px]">
                      {tenant.admin_id}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyAdminId(tenant.admin_id);
                      }}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      {copied === tenant.admin_id ? (
                        <Check size={12} className="text-emerald-400" />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Created{" "}
                    {tenant.created_at
                      ? new Date(tenant.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Quick stats */}
                <div className="hidden md:flex items-center gap-4">
                  <QuickStat icon={Users} value={tenant.user_count} />
                  <QuickStat icon={Database} value={tenant.file_count} />
                  <QuickStat icon={MessageSquare} value={tenant.chat_count} />
                  <QuickStat icon={KeyRound} value={tenant.token_count} />
                </div>

                {/* Status badge */}
                {tenant.maintenance_mode && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle size={10} className="text-amber-400" />
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      Maintenance
                    </span>
                  </span>
                )}

                {/* Expand toggle */}
                {isExpanded ? (
                  <ChevronUp size={16} className="text-zinc-500" />
                ) : (
                  <ChevronDown size={16} className="text-zinc-500" />
                )}
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t border-zinc-800 pt-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  <StatBox
                    label="Users"
                    value={tenant.user_count}
                    icon={Users}
                  />
                  <StatBox
                    label="Files"
                    value={tenant.file_count}
                    icon={Database}
                  />
                  <StatBox
                    label="Chats"
                    value={tenant.chat_count}
                    icon={MessageSquare}
                  />
                  <StatBox
                    label="Tokens"
                    value={`${tenant.used_token_count}/${tenant.token_count}`}
                    icon={KeyRound}
                  />
                </div>

                {/* Settings */}
                <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                    Configuration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ConfigItem
                      label="Strict Knowledge"
                      value={tenant.strict_knowledge_mode ? "Enabled" : "Disabled"}
                    />
                    <ConfigItem
                      label="Temperature"
                      value={tenant.temperature}
                    />
                    <ConfigItem
                      label="Last Updated"
                      value={
                        tenant.settings_updated_at
                          ? new Date(tenant.settings_updated_at).toLocaleDateString()
                          : "Never"
                      }
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      handleToggleMaintenance(
                        tenant.admin_id,
                        tenant.maintenance_mode
                      )
                    }
                    disabled={actionLoading === tenant.admin_id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      tenant.maintenance_mode
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    {tenant.maintenance_mode ? (
                      <>
                        <Power size={14} />
                        Disable Maintenance
                      </>
                    ) : (
                      <>
                        <PowerOff size={14} />
                        Enable Maintenance
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {tenants.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
          <Building2 size={32} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No tenants found.</p>
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon: Icon, value }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="text-zinc-600" />
      <span className="text-xs text-zinc-400 font-medium">{value}</span>
    </div>
  );
}

function StatBox({ label, value, icon: Icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center">
        <Icon size={14} className="text-zinc-500" />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        <p className="text-[10px] text-zinc-600 uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

function ConfigItem({ label, value }) {
  return (
    <div className="flex items-center justify-between sm:flex-col sm:items-start gap-1">
      <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-zinc-300 font-medium">{value}</span>
    </div>
  );
}
