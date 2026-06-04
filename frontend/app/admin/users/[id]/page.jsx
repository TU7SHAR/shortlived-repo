import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { User, Phone, Target, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function UserProfilePage({ params }) {
  const { id } = await params;

  // Fetch specific user data
  const { data: user } = await supabaseAdmin
    .from("authorized_users")
    .select("*, onboarding:onboarding_leads(*)")
    .eq("id", id)
    .single();

  if (!user)
    return <div className="p-10 text-center font-bold">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <Link
        href="/admin/users"
        className="flex items-center gap-2 text-zinc-400 hover:text-black transition-colors text-sm font-bold"
      >
        <ArrowLeft size={16} /> Back to Fleet
      </Link>

      <div className="flex items-center gap-6 border-b border-zinc-100 pb-8">
        <div className="h-20 w-20 bg-black rounded-3xl flex items-center justify-center text-white shadow-xl">
          <User size={40} />
        </div>
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter">
            {user.onboarding?.full_name || "Profile Dossier"}
          </h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest mt-1">
            UUID: {user.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Onboarding Data Card */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50 pb-4">
            Onboarding Capture
          </h2>

          <div className="space-y-4">
            <InfoRow label="Telegram ID" value={user.telegram_id} />
            <InfoRow
              label="Phone"
              value={user.onboarding?.phone_number}
              icon={<Phone size={12} />}
            />
            <InfoRow label="Role" value={user.onboarding?.role} />
            <InfoRow
              label="Experience"
              value={user.onboarding?.experience_level}
            />
          </div>
        </div>

        {/* Ambition Card */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white rounded-3xl p-8 space-y-4 shadow-xl">
            <Target className="text-zinc-500" size={24} />
            <p className="text-lg font-medium leading-relaxed italic">
              "{user.onboarding?.goal || "No goal specified."}"
            </p>
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase pt-4 border-t border-zinc-800">
              <Heart size={14} /> Passion:{" "}
              {user.onboarding?.passion || "Unknown"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span className="text-lg font-bold text-black">{value || "—"}</span>
    </div>
  );
}
