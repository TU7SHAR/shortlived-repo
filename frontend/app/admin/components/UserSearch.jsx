"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function UserSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set("q", e.target.value);
    } else {
      params.delete("q");
    }
    // Update the URL without refreshing the page
    router.replace(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center bg-white border-2 border-zinc-200 rounded-2xl px-4 py-3 w-full md:w-80 shadow-sm focus-within:border-black focus-within:ring-2 transition-all">
      <Search size={24} className="text-zinc-400 mr-3 shrink-0" />
      <input
        type="text"
        defaultValue={searchParams.get("q") || ""}
        onChange={handleSearch}
        placeholder="Search Telegram ID..."
        className="bg-transparent border-none outline-none w-full text-black font-bold placeholder-zinc-400 text-lg"
      />
    </div>
  );
}
