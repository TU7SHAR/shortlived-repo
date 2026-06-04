"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read current URL params
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";
  const currentDays =
    searchParams.get("days") || (!currentStart && !currentEnd ? "7" : "");

  // Local state for the custom inputs
  const [customStart, setCustomStart] = useState(currentStart);
  const [customEnd, setCustomEnd] = useState(currentEnd);

  // Keep inputs in sync if URL changes (e.g., user clicks back button)
  useEffect(() => {
    setCustomStart(currentStart);
    setCustomEnd(currentEnd);
  }, [currentStart, currentEnd]);

  const handlePresetChange = (days) => {
    const params = new URLSearchParams(searchParams);
    params.set("days", days);
    params.delete("start");
    params.delete("end");
    params.set("page", "1"); // Reset pagination

    setCustomStart("");
    setCustomEnd("");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;

    // FAILSAFE: Ensure start date is before or equal to end date
    if (new Date(customStart) > new Date(customEnd)) {
      alert("Start date cannot be after the end date!");
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.delete("days");
    params.set("start", customStart);
    params.set("end", customEnd);
    params.set("page", "1");

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Determine if the custom date range is the currently active filter
  const isCustomActive = !!(currentStart && currentEnd);

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full">
      {/* 1. Quick Presets */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1.5 sm:p-1 rounded-xl sm:rounded-lg border border-zinc-200 w-full xl:w-auto">
        <div className="pl-2 pr-1 text-zinc-400 hidden sm:block shrink-0">
          <Calendar size={16} />
        </div>
        {[7, 14, 30].map((days) => (
          <button
            key={days}
            onClick={() => handlePresetChange(days)}
            className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-bold rounded-lg sm:rounded-md transition-colors whitespace-nowrap ${
              currentDays === days.toString() && !isCustomActive
                ? "bg-white text-black shadow-sm"
                : "text-zinc-500 hover:text-black"
            }`}
          >
            {days}D
          </button>
        ))}
      </div>

      {/* 2. Custom Date Range Picker */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 sm:p-1 rounded-xl sm:rounded-lg border transition-colors w-full xl:w-auto ${
          isCustomActive
            ? "bg-blue-50 border-blue-200"
            : "bg-zinc-100 border-zinc-200"
        }`}
      >
        {/* Dynamic Badge (Hidden on mobile to save space) */}
        {isCustomActive && (
          <span className="pl-2 pr-1 text-xs font-black text-blue-600 uppercase tracking-widest hidden sm:inline-block shrink-0">
            Custom
          </span>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {/* Start Date Container */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-zinc-400 sm:hidden w-8 shrink-0">
              From
            </span>
            <input
              type="date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className={`flex-1 sm:w-auto bg-white border text-xs font-medium px-3 py-2 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-colors ${
                isCustomActive
                  ? "border-blue-200 text-blue-900"
                  : "border-zinc-200 text-black"
              }`}
            />
          </div>

          <span
            className={`hidden sm:block text-xs font-bold shrink-0 ${
              isCustomActive ? "text-blue-400" : "text-zinc-400"
            }`}
          >
            to
          </span>

          {/* End Date Container */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-zinc-400 sm:hidden w-8 shrink-0">
              To
            </span>
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className={`flex-1 sm:w-auto bg-white border text-xs font-medium px-3 py-2 sm:px-2 sm:py-1.5 rounded-lg sm:rounded-md focus:outline-none focus:ring-2 focus:ring-black transition-colors ${
                isCustomActive
                  ? "border-blue-200 text-blue-900"
                  : "border-zinc-200 text-black"
              }`}
            />
          </div>
        </div>

        {/* Dynamic Button State */}
        <button
          onClick={handleCustomApply}
          disabled={
            !customStart ||
            !customEnd ||
            (customStart === currentStart && customEnd === currentEnd)
          }
          className="w-full sm:w-auto mt-1 sm:mt-0 bg-black text-white px-3 py-2.5 sm:py-1.5 rounded-lg sm:rounded-md text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {isCustomActive &&
          customStart === currentStart &&
          customEnd === currentEnd
            ? "Applied ✓"
            : "Apply"}
        </button>
      </div>
    </div>
  );
}
