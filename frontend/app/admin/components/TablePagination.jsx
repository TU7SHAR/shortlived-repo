"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function TablePagination({
  totalItems,
  itemsPerPage,
  itemName = "items",
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2">
      <div className="text-xs sm:text-sm text-zinc-500 font-medium text-center sm:text-left w-full sm:w-auto">
        Showing{" "}
        <span className="font-bold text-black">
          {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
        </span>{" "}
        to{" "}
        <span className="font-bold text-black">
          {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="font-bold text-black">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
        </button>

        <div className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-zinc-100 rounded-lg text-black min-w-[3rem] sm:min-w-[4rem] text-center">
          {currentPage} / {totalPages}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
