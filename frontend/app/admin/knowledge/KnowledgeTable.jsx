"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Database,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { deleteIngestedFile, bulkDeleteFiles } from "../../actions/adminAuth";

export default function KnowledgeTable({
  files,
  totalCount,
  currentPage,
  perPage,
  currentSearch,
  currentCategory,
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearch);
  const [selected, setSelected] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  const totalPages = Math.ceil(totalCount / perPage);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentCategory) params.set("category", currentCategory);
    startTransition(() => {
      router.push(`/admin/knowledge?${params.toString()}`);
    });
  };

  const handleCategory = (cat) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cat !== "all") params.set("category", cat);
    startTransition(() => {
      router.push(`/admin/knowledge?${params.toString()}`);
    });
  };

  const handlePage = (page) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (currentCategory) params.set("category", currentCategory);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`/admin/knowledge?${params.toString()}`);
    });
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Permanently delete this file and all its chunks/embeddings?")) return;
    setActionLoading(fileId);
    const result = await deleteIngestedFile(fileId);
    if (result.success) {
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const handleBulkDelete = async () => {
    setShowBulkConfirm(false);
    setActionLoading("bulk");
    const result = await bulkDeleteFiles(selected);
    if (result.success) {
      setSelected([]);
      startTransition(() => router.refresh());
    }
    setActionLoading(null);
  };

  const toggleSelect = (fileId) => {
    setSelected((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === files.length) {
      setSelected([]);
    } else {
      setSelected(files.map((f) => f.id));
    }
  };

  const categories = ["all", "Our Products", "Competitor Products", "Price Lists"];

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
          />
        </form>

        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                (currentCategory || "all") === cat
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <span className="text-sm text-red-400 font-medium">
            {selected.length} file{selected.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected([])}
              className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={actionLoading === "bulk"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              <Trash2 size={12} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={`relative ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      {selected.length === files.length && files.length > 0 ? (
                        <CheckSquare size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Admin
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {files.map((file) => (
                  <tr
                    key={file.id}
                    className={`hover:bg-zinc-800/30 transition-colors ${
                      selected.includes(file.id) ? "bg-zinc-800/20" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSelect(file.id)}
                        className="text-zinc-500 hover:text-white transition-colors"
                      >
                        {selected.includes(file.id) ? (
                          <CheckSquare size={14} className="text-blue-400" />
                        ) : (
                          <Square size={14} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <FileText size={14} className="text-zinc-600 shrink-0" />
                        <span className="text-sm text-white font-medium truncate max-w-[200px]">
                          {file.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        {file.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-zinc-500 font-mono truncate max-w-[100px] inline-block">
                        {file.admin_id?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-zinc-500">
                        {new Date(file.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          file.condensation_status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : file.condensation_status === "failed"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {file.condensation_status || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(file.id)}
                        disabled={actionLoading === file.id}
                        className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {files.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <Database size={24} className="text-zinc-700 mx-auto mb-2" />
                      <p className="text-zinc-600 text-sm">No files found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span className="text-xs text-zinc-600">
              Showing {(currentPage - 1) * perPage + 1}–
              {Math.min(currentPage * perPage, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-zinc-400 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBulkConfirm(false)}
          />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Deletion</h3>
                <p className="text-sm text-zinc-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-6">
              You are about to permanently delete{" "}
              <span className="text-white font-semibold">{selected.length}</span>{" "}
              file{selected.length > 1 ? "s" : ""} and all associated chunks,
              embeddings, and knowledge cards.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
