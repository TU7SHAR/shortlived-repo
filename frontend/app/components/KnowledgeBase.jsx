"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Trash2,
  Loader2,
  FileText,
  CheckSquare,
  Tag,
  FolderClosed,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { applyFiltersAndSort } from "../utils/sortUtils";
import { DB } from "@/app/lib/schema_map";

export default function KnowledgeBaseTable() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const fetchLock = useRef(false);

  // Selection State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Sorting & Filtering State using DB Schema Map
  const [sortConfig, setSortConfig] = useState({
    key: DB.FILES.CREATED_AT,
    direction: "desc",
    filterKey: DB.FILES.CATEGORY,
    filterValue: "All",
  });

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    if (fetchLock.current) return;

    fetchLock.current = true;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      // ✅ FIXED: We are now using DB.FILES.CREATED_BY instead of "admin_id"
      const { data, error } = await supabase
        .from(DB.FILES.TABLE)
        .select("*")
        .eq(DB.FILES.CREATED_BY, user.id)
        .order(DB.FILES.CREATED_AT, { ascending: false });

      // If it throws an error, we log the actual Supabase error object so it isn't just {}
      if (error) {
        console.error("Supabase Database Error:", error);
        throw error;
      }

      // If no files exist, data will be null, and we safely set an empty array!
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error.message || error);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  };

  // Compute breakdown metrics for top cards dynamically
  const stats = useMemo(() => {
    const total = files.length;
    const ourProducts = files.filter(
      (f) => f[DB.FILES.CATEGORY] === "Our Products",
    ).length;
    const competitiveList = files.filter(
      (f) => f[DB.FILES.CATEGORY] === "Competitive List",
    ).length;
    const priceList = files.filter(
      (f) => f[DB.FILES.CATEGORY] === "Price List",
    ).length;

    return { total, ourProducts, competitiveList, priceList };
  }, [files]);

  // Handle Sort/Filter logic dynamically
  const sortedAndFilteredFiles = useMemo(() => {
    return applyFiltersAndSort(files, sortConfig);
  }, [files, sortConfig]);

  // Select/Deselect Individual File
  const toggleSelectFile = (id) => {
    setSelectedFiles((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Select/Deselect All currently visible files
  const toggleSelectAll = () => {
    const visibleIds = sortedAndFilteredFiles.map((f) => f[DB.FILES.ID]);
    const allSelected = visibleIds.every((id) => selectedFiles.includes(id));

    if (allSelected) {
      setSelectedFiles((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedFiles((prev) => [
        ...prev,
        ...visibleIds.filter((id) => !prev.includes(id)),
      ]);
    }
  };

  // Exit selection layout cleanly
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedFiles([]);
  };

  // Single File Deletion Logic
  const deleteFile = async (id, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

    setDeletingId(id);
    try {
      const response = await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: id, filename }),
      });

      if (!response.ok) throw new Error("Delete operation failed");

      setFiles((prev) => prev.filter((file) => file[DB.FILES.ID] !== id));
      setSelectedFiles((prev) => prev.filter((item) => item !== id));
    } catch (error) {
      alert("Error deleting file: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk File Deletion Logic
  const deleteSelectedFiles = async () => {
    if (selectedFiles.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedFiles.length} selected files?`,
      )
    )
      return;

    setIsDeletingBulk(true);
    try {
      const filesToBulkDelete = files.filter((f) =>
        selectedFiles.includes(f[DB.FILES.ID]),
      );

      const response = await fetch("/api/delete-file-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesToBulkDelete }),
      });

      if (!response.ok) throw new Error("Bulk delete operations failed");

      setFiles((prev) =>
        prev.filter((file) => !selectedFiles.includes(file[DB.FILES.ID])),
      );
      exitSelectMode();
    } catch (error) {
      alert("Error during bulk delete: " + error.message);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Loading your knowledge assets...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-6 min-h-full">
      <div className="mb-2">
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight md:pt-4">
          Knowledge Base
        </h1>
        <p className="text-[0.95rem] text-grey-500 mt-1 pb-3">
          Manage the documents currently stored in the RAG bot's memory.
        </p>
      </div>

      {/* Balanced Summary Cards Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3 bg-primary-light text-primary rounded-xl">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider">
              Total Files
            </p>
            <p className="text-2xl font-bold text-navy font-display">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3 bg-[#F0FDF4] text-[#25D366] rounded-xl">
            <Tag size={20} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider">
              Our Products
            </p>
            <p className="text-2xl font-bold text-navy font-display">
              {stats.ourProducts}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <FolderClosed size={20} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider">
              Competitive
            </p>
            <p className="text-2xl font-bold text-navy font-display">
              {stats.competitiveList}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider">
              Price List
            </p>
            <p className="text-2xl font-bold text-navy font-display">
              {stats.priceList}
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Filter Panel Row */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-grey-100 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {["All", "Our Products", "Competitive List", "Price List"].map(
            (category) => (
              <button
                key={category}
                onClick={() =>
                  setSortConfig((prev) => ({ ...prev, filterValue: category }))
                }
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  sortConfig.filterValue === category
                    ? "bg-[#1d4ed8] text-white shadow-sm"
                    : "bg-grey-50 text-grey-600 hover:bg-grey-100 hover:text-navy"
                }`}
              >
                {category}
              </button>
            ),
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={`${sortConfig.key}-${sortConfig.direction}`}
            onChange={(e) => {
              const [key, direction] = e.target.value.split("-");
              setSortConfig((prev) => ({ ...prev, key, direction }));
            }}
            className="bg-grey-50 border border-grey-100 text-grey-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-semibold transition-all cursor-pointer"
          >
            <option value={`${DB.FILES.CREATED_AT}-desc`}>Newest First</option>
            <option value={`${DB.FILES.CREATED_AT}-asc`}>Oldest First</option>
            <option value={`${DB.FILES.FILENAME}-asc`}>A-Z</option>
            <option value={`${DB.FILES.FILENAME}-desc`}>Z-A</option>
          </select>

          {!isSelectMode ? (
            <button
              onClick={() => setIsSelectMode(true)}
              disabled={sortedAndFilteredFiles.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-primary bg-primary-light hover:bg-primary/20 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckSquare size={14} />
              <span>Select Files</span>
            </button>
          ) : (
            <div className="flex gap-1.5">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 text-xs font-semibold bg-grey-50 border border-grey-100 hover:bg-grey-100 text-navy rounded-lg transition-all"
              >
                {sortedAndFilteredFiles
                  .map((f) => f[DB.FILES.ID])
                  .every((id) => selectedFiles.includes(id))
                  ? "Deselect Page"
                  : "Select Page"}
              </button>
              <button
                onClick={deleteSelectedFiles}
                disabled={selectedFiles.length === 0 || isDeletingBulk}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeletingBulk ? (
                  <Loader2 className="animate-spin" size={13} />
                ) : (
                  <Trash2 size={13} />
                )}
                <span>Delete ({selectedFiles.length})</span>
              </button>
              <button
                onClick={exitSelectMode}
                className="px-3 py-2 text-xs font-semibold text-grey-600 bg-white border border-grey-100 hover:bg-grey-50 hover:text-navy rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fluid Stack Layout for File Records */}
      <div className="bg-white border border-grey-100 rounded-xl shadow-sm overflow-hidden p-2">
        {sortedAndFilteredFiles.length === 0 ? (
          <div className="py-12 text-center text-grey-400 text-sm font-medium">
            No matching documents discovered inside this repository segment.
          </div>
        ) : (
          <div className="space-y-1">
            {sortedAndFilteredFiles.map((file) => (
              <div
                key={file[DB.FILES.ID]}
                onClick={() =>
                  isSelectMode && toggleSelectFile(file[DB.FILES.ID])
                }
                className={`flex items-center justify-between p-3.5 rounded-lg border transition-all ${
                  selectedFiles.includes(file[DB.FILES.ID])
                    ? "bg-primary-light/50 border-primary/20 shadow-sm"
                    : "bg-white border-transparent hover:bg-grey-50"
                } ${isSelectMode ? "cursor-pointer select-none" : ""}`}
              >
                <div className="flex items-center space-x-4 min-w-0 w-full">
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file[DB.FILES.ID])}
                      onChange={() => toggleSelectFile(file[DB.FILES.ID])}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-primary border-grey-300 rounded focus:ring-primary transition-all cursor-pointer bg-white"
                    />
                  )}
                  <div className="p-2.5 bg-grey-50 rounded-xl border border-grey-100 text-grey-500 flex-shrink-0">
                    <FileText size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex flex-col flex-1">
                    <span className="font-bold font-display text-navy truncate text-[0.95rem]">
                      {file[DB.FILES.FILENAME]}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-grey-500 font-medium mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${
                          file[DB.FILES.CATEGORY] === "Our Products"
                            ? "bg-[#F0FDF4] text-[#16a34a]"
                            : file[DB.FILES.CATEGORY] === "Competitive List"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-purple-50 text-purple-700"
                        }`}
                      >
                        {file[DB.FILES.CATEGORY] || "Our Products"}
                      </span>
                      <span className="text-grey-300">•</span>
                      <span>
                        Uploaded by @
                        {file[DB.FILES.UPLOADED_BY_USER] || "Unknown"}
                      </span>
                      <span className="text-grey-300">•</span>
                      <span>
                        {new Date(
                          file[DB.FILES.CREATED_AT],
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file[DB.FILES.ID], file[DB.FILES.FILENAME]);
                  }}
                  disabled={deletingId === file[DB.FILES.ID] || isDeletingBulk}
                  className={`p-2.5 rounded-xl transition-all flex-shrink-0 ml-2 ${
                    deletingId === file[DB.FILES.ID]
                      ? "text-red-500 bg-red-50 cursor-not-allowed"
                      : "text-grey-400 hover:text-red-600 hover:bg-red-50"
                  }`}
                  title="Delete File"
                >
                  {deletingId === file[DB.FILES.ID] ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
