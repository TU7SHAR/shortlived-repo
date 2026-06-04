"use client";

import { useState, useTransition } from "react";
import { toggleMaintenanceMode } from "../../actions/botSettings";
import { ShieldAlert, Activity, Lock, Unlock } from "lucide-react";

export default function MaintenanceSwitch({ initialStatus }) {
  const [isMaintenance, setIsMaintenance] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isPending) return;

    const newState = !isMaintenance;
    setIsMaintenance(newState); // Optimistic UI
    startTransition(async () => {
      await toggleMaintenanceMode(newState);
    });
  };

  return (
    <div className="max-w-6xl pt-4 sm:pt-8 m-auto">
      {/* Settings Card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300 ${
          isMaintenance
            ? "bg-red-50/50 border-red-200"
            : "bg-white border-zinc-200"
        }`}
      >
        {/* Left Side: Icon & Description */}
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 transition-colors ${
              isMaintenance
                ? "bg-red-100 text-red-600"
                : "bg-emerald-100 text-emerald-600"
            }`}
          >
            {isMaintenance ? <ShieldAlert size={24} /> : <Activity size={24} />}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
              {isMaintenance
                ? "Maintenance Mode is Active"
                : "Maintenance Mode is Disabled"}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-md leading-relaxed">
              {isMaintenance
                ? "The system is currently locked. The bot will ignore user commands and serve the standard offline message."
                : "The system is nominal. The bot is fully active and processing incoming user requests."}
            </p>
          </div>
        </div>

        {/* Right Side: The Action Button */}
        <div className="shrink-0 flex flex-col items-stretch md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-100 w-full md:w-auto">
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-offset-2 w-full md:w-auto ${
              isMaintenance
                ? "bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-zinc-900"
                : "bg-white border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 focus:ring-red-500"
            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
          >
            {isMaintenance ? <Unlock size={16} /> : <Lock size={16} />}
            {isMaintenance ? "Restore Access" : "Lock System"}
          </button>

          <span
            className={`text-[10px] font-bold uppercase tracking-widest flex items-center justify-center md:justify-end gap-1.5 ${
              isMaintenance ? "text-red-500" : "text-emerald-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isMaintenance ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}
            />
            {isMaintenance ? "Traffic Blocked" : "Accepting Traffic"}
          </span>
        </div>
      </div>
    </div>
  );
}
