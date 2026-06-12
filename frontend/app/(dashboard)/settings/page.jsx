"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  ShieldAlert,
  Loader2,
  Power,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "@/app/utils/config";

export default function BotSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    strict_knowledge_mode: true,
    maintenance_mode: false,
  });

  useEffect(() => {
    document.title = `Settings | ${siteConfig.name}`;
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from(DB.SETTINGS.TABLE)
        .select("*")
        .eq(DB.SETTINGS.CREATED_BY, user.id)
        .single();

      if (data) {
        setSettings({
          strict_knowledge_mode: data[DB.SETTINGS.STRICT_MODE] ?? true,
          maintenance_mode: data[DB.SETTINGS.MAINTENANCE_MODE] ?? false,
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from(DB.SETTINGS.TABLE).upsert(
        {
          [DB.SETTINGS.CREATED_BY]: user.id,
          [DB.SETTINGS.STRICT_MODE]: settings.strict_knowledge_mode,
          [DB.SETTINGS.MAINTENANCE_MODE]: settings.maintenance_mode,
          [DB.SETTINGS.UPDATED_AT]: new Date().toISOString(),
        },
        { onConflict: DB.SETTINGS.CREATED_BY },
      );

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-slate-500 text-sm font-medium">
        <Loader2 className="animate-spin text-blue-600 mr-2" size={18} />
        Loading bot configurations...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-1">
            <Settings size={22} className="text-blue-600" />
            Bot Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage the core operational parameters of your AI agent.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            saved
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : saved ? (
            <CheckCircle2 size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving
            ? "Saving..."
            : saved
              ? "Configuration Saved"
              : "Save Changes"}
        </button>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {/* Maintenance Mode */}
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-slate-400">
              <Power size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Maintenance Mode
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">
                Take the bot offline for all end-users. It will respond with a
                friendly maintenance message until disabled.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.maintenance_mode}
              onChange={(e) =>
                setSettings({ ...settings, maintenance_mode: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        {/* Strict Knowledge Mode */}
        <div className="p-6 flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 text-slate-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Strict Knowledge Enforcement
              </h3>
              <p className="text-sm text-slate-500 mt-1 max-w-lg">
                Force the bot to rely strictly on uploaded documents. It will
                actively refuse to answer out-of-context queries.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={settings.strict_knowledge_mode}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  strict_knowledge_mode: e.target.checked,
                })
              }
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
