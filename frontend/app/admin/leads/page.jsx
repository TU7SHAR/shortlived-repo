import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { UserPlus, Phone, Target, Heart, Search, Filter } from "lucide-react";
import TablePagination from "../components/TablePagination";

export default async function OnboardingLeadsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const ITEMS_PER_PAGE = 10;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data: leads, count } = await supabaseAdmin
    .from("onboarding_leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            Onboarding Pipeline
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1 sm:mt-0">
            Review and convert potential bot users.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <div className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold text-zinc-600">
            Total: {count}
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold">
              <tr>
                <th className="px-4 py-3 sm:px-6">Lead Contact</th>
                <th className="px-4 py-3 sm:px-6">Professional Context</th>
                <th className="px-4 py-3 sm:px-6">Ambition & Goal</th>
                <th className="px-4 py-3 sm:px-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leads?.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-zinc-50 transition-colors group"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="font-bold text-zinc-900 text-sm sm:text-base">
                      {lead.full_name || "N/A"}
                    </div>
                    <div className="text-zinc-500 text-xs flex items-center gap-1 mt-1">
                      <Phone size={12} />{" "}
                      {lead.phone_number || "No Phone Provided"}
                    </div>
                    <div className="text-zinc-400 text-[10px] font-mono mt-1">
                      TG: {lead.telegram_id}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-tight">
                      {lead.role}
                    </span>
                    <div className="text-zinc-500 text-xs mt-1.5">
                      Exp: {lead.experience_level}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 max-w-sm">
                    <div className="text-zinc-800 font-medium leading-tight text-xs sm:text-sm">
                      "{lead.goal}"
                    </div>
                    <div className="text-zinc-400 text-[11px] sm:text-xs mt-1.5 flex items-center gap-1.5">
                      <Heart size={12} className="shrink-0" />{" "}
                      <span className="truncate">{lead.passion}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right tabular-nums text-zinc-400 font-medium text-xs sm:text-sm">
                    {new Date(lead.created_at).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 p-2 sm:p-0">
          <TablePagination
            totalItems={count || 0}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="Leads"
          />
        </div>
      </div>
    </div>
  );
}
