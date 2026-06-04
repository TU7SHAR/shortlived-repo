import { supabaseAdmin } from "../../lib/supabaseAdmin";
import {
  Ticket,
  User,
  Copy,
  CheckCircle2,
  XCircle,
  AtSign,
} from "lucide-react";
import TablePagination from "../components/TablePagination";

export default async function AdminInvitesPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const ITEMS_PER_PAGE = 15;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data: tokens, count } = await supabaseAdmin
    .from("invite_tokens")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900">
            Access Control
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm mt-1 sm:mt-0">
            Audit and track every invite link in the system.
          </p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm w-full">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[750px]">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-semibold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-4 py-3 sm:px-6">Token String</th>
                <th className="px-4 py-3 sm:px-6">Assignment (Caption)</th>
                <th className="px-4 py-3 sm:px-6">Claimed By</th>
                <th className="px-4 py-3 sm:px-6 text-center">Status</th>
                <th className="px-4 py-3 sm:px-6 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium">
              {tokens?.map((token) => (
                <tr
                  key={token.id}
                  className="hover:bg-zinc-50 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-2 group cursor-pointer">
                      <code className="bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded font-mono text-[10px] sm:text-xs">
                        {token.token_string}
                      </code>
                      <Copy
                        size={12}
                        className="text-zinc-300 group-hover:text-black shrink-0"
                      />
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-zinc-600 text-xs sm:text-sm">
                    {token.caption}
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    {token.used_by_username ? (
                      <div className="text-black font-bold flex items-center gap-1 text-xs sm:text-sm">
                        <AtSign size={12} />{" "}
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {token.used_by_username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-300 italic text-[11px] sm:text-xs">
                        Unclaimed
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-center">
                    {token.is_revoked ? (
                      <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase">
                        Revoked
                      </span>
                    ) : token.is_used ? (
                      <span className="text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase">
                        Used
                      </span>
                    ) : (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase">
                        Valid
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right text-zinc-400 tabular-nums text-xs sm:text-sm whitespace-nowrap">
                    {new Date(token.created_at).toLocaleDateString()}
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
            itemName="Tokens"
          />
        </div>
      </div>
    </div>
  );
}
