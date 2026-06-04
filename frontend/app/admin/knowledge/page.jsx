import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { FileText, User, Tag, Calendar, HardDrive } from "lucide-react";

export default async function KnowledgeBasePage() {
  const { data: files } = await supabaseAdmin
    .from("ingested_files")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            Knowledge Ingestion
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1 sm:mt-0">
            Manage the documents powering the AI's strict knowledge mode.
          </p>
        </div>
        <div className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 self-start sm:self-auto shrink-0">
          <HardDrive size={14} /> {files?.length || 0} Files Active
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files?.map((file) => (
          <div
            key={file.id}
            className="bg-white border border-zinc-200 p-4 rounded-xl shadow-sm hover:border-black transition-all flex flex-col"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-zinc-100 rounded-lg text-zinc-900 shrink-0">
                <FileText size={20} />
              </div>
              <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate ml-2">
                {file.category || "General"}
              </span>
            </div>
            <h3
              className="font-bold text-zinc-900 text-sm sm:text-base break-words line-clamp-2 mb-2 flex-1"
              title={file.filename}
            >
              {file.filename}
            </h3>
            <div className="space-y-1.5 border-t border-zinc-50 pt-3 mt-auto">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-zinc-500">
                <User size={12} className="shrink-0" />{" "}
                <span className="truncate">
                  {file.uploaded_by_username || "System Admin"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium">
                <Calendar size={12} className="shrink-0" /> Uploaded:{" "}
                {new Date(file.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
