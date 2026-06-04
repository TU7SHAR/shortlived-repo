import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { Users } from "lucide-react";
import UserFleetTable from "../components/UserFleetTable";

export default async function AdminUsersPage() {
  // 1. Fetch tables separately in parallel to bypass relationship errors
  const [usersRes, leadsRes] = await Promise.all([
    supabaseAdmin
      .from("authorized_users")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("onboarding_leads").select("*"),
  ]);

  if (usersRes.error) console.error("Fetch Error:", usersRes.error.message);

  // 2. Merge them in Javascript based on the Telegram ID
  const combinedUsers = (usersRes.data || []).map((user) => {
    return {
      ...user,
      onboarding:
        leadsRes.data?.find(
          (lead) => String(lead.telegram_id) === String(user.telegram_id),
        ) || null,
    };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-zinc-200 pb-6">
        <div className="p-3 bg-black text-white rounded-xl shadow-lg shrink-0 w-fit">
          <Users size={24} className="sm:w-7 sm:h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight">
            Bot Authorized Users
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium mt-1">
            Direct management of Telegram IDs, profile context, and ban
            controls.
          </p>
        </div>
      </div>

      {/* Pass the safely merged data to the table */}
      <div className="w-full overflow-x-auto">
        <UserFleetTable initialUsers={combinedUsers} />
      </div>
    </div>
  );
}
