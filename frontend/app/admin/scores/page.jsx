import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Trophy, ArrowRight, Clipboard } from "lucide-react";
import Link from "next/link";

export default async function AdminScoresPage() {
  const { data: tests, error } = await supabaseAdmin
    .from("test_results")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error:", error.message);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b border-zinc-200 pb-6">
        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg">
          <Trophy size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight uppercase">
            Performance Ledger
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Audit assessments and drill into specific test data.
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200 font-black text-[10px] uppercase tracking-[0.2em] text-zinc-400">
            <tr>
              <th className="px-6 py-4">Participant ID</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-center">Score Result</th>
              <th className="px-6 py-4 text-right">Completion Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 font-medium">
            {tests?.map((test) => (
              <tr
                key={test.id}
                className="hover:bg-zinc-50 transition-all group"
              >
                <td className="px-6 py-5 font-mono font-bold text-zinc-900">
                  {test.telegram_id}
                </td>
                <td className="px-6 py-5 text-zinc-500 font-bold uppercase text-[10px]">
                  {test.category}
                </td>
                <td className="px-6 py-5 text-center">
                  <Link
                    href={`/admin/scores/${test.id}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm ${
                      test.score / test.total_questions >= 0.7
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-black"
                        : "bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-black"
                    }`}
                  >
                    {test.score} / {test.total_questions}
                    <ArrowRight size={12} />
                  </Link>
                </td>
                <td className="px-6 py-5 text-right tabular-nums text-zinc-400 font-bold">
                  {new Date(test.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
