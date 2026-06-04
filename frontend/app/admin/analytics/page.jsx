import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { MessageSquare, User, Clock, Search } from "lucide-react";
import TablePagination from "../components/TablePagination";

export default async function ChatAnalyticsPage({ searchParams }) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const ITEMS_PER_PAGE = 20;
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data: chats, count } = await supabaseAdmin
    .from("chat_analytics")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Interaction Logs</h1>
        <p className="text-zinc-500 text-sm">
          Real-time audit of every query and bot response.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 w-48">User</th>
              <th className="px-4 py-3">Query / Response</th>
              <th className="px-4 py-3 w-32 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {chats?.map((chat) => (
              <tr key={chat.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3 align-top">
                  <div className="font-bold text-zinc-900">
                    @{chat.username || "Unknown"}
                  </div>
                  <div className="text-zinc-400 font-mono text-[10px]">
                    ID: {chat.telegram_id}
                  </div>
                </td>
                <td className="px-4 py-3 space-y-2">
                  <div className="bg-zinc-100 p-2 rounded-lg text-zinc-800">
                    <span className="font-bold text-[10px] uppercase text-zinc-400 block mb-1">
                      User Query:
                    </span>
                    {chat.user_query}
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-900">
                    <span className="font-bold text-[10px] uppercase text-blue-400 block mb-1">
                      Bot Response:
                    </span>
                    {chat.bot_response}
                  </div>
                </td>
                <td className="px-4 py-3 align-top text-right text-zinc-400 tabular-nums">
                  {new Date(chat.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          totalItems={count || 0}
          itemsPerPage={ITEMS_PER_PAGE}
          itemName="Logs"
        />
      </div>
    </div>
  );
}
