"use client";

import { toggleUserBan } from "../../actions/manageUsers";
import { ShieldAlert, ShieldCheck, User, Calendar } from "lucide-react";

export default function UserFleetTable({ initialUsers }) {
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "N/A";

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-x-auto w-full">
      <table className="w-full text-left text-sm border-collapse min-w-[600px]">
        <thead className="bg-zinc-50 border-b border-zinc-200">
          <tr>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Telegram ID
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Profile Context
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Registration Date
            </th>
            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">
              Security Control
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 font-medium">
          {initialUsers.map((user) => (
            <tr
              key={user.telegram_id || user.id}
              className={`transition-colors ${user.is_banned ? "bg-red-50/50" : "hover:bg-zinc-50"}`}
            >
              <td className="px-6 py-5">
                <div className="text-base font-black text-black font-mono">
                  {user.telegram_id || "Unlinked"}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {user.is_banned ? (
                    <span className="text-[10px] font-black text-red-600 uppercase flex items-center gap-1">
                      <ShieldAlert size={10} /> Banned
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                      <ShieldCheck size={10} /> Active
                    </span>
                  )}
                </div>
              </td>

              <td className="px-6 py-5">
                {user.onboarding ? (
                  <div className="space-y-1">
                    <div className="font-bold text-zinc-900 flex items-center gap-2">
                      <User size={14} className="text-zinc-400" />{" "}
                      {user.onboarding.full_name}
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                      {user.onboarding.role}
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-400 italic text-[11px]">
                    No Profile Data
                  </span>
                )}
              </td>

              <td className="px-6 py-5">
                <div className="text-zinc-700 font-bold flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  {formatDate(user.created_at)}
                </div>
              </td>

              <td className="px-6 py-5 text-right">
                <form
                  action={() => toggleUserBan(user.telegram_id, user.is_banned)}
                >
                  <button
                    type="submit"
                    disabled={!user.telegram_id}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm ${
                      !user.telegram_id
                        ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                        : user.is_banned
                          ? "bg-black text-white hover:bg-zinc-800"
                          : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white"
                    }`}
                  >
                    {user.is_banned ? "Remove Ban" : "Ban User"}
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
