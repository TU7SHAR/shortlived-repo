import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Look up a user's telegram_id from their Supabase auth ID
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authId = searchParams.get("authId");

  if (!authId) {
    return NextResponse.json({ error: "authId required" }, { status: 400 });
  }

  // The authId IS the admin_id in authorized_users
  // Find any telegram user linked to this admin
  const { data, error } = await supabaseAdmin
    .from("authorized_users")
    .select("telegram_id")
    .eq("admin_id", authId)
    .limit(1)
    .single();

  if (error || !data) {
    // Fallback: check if the user IS an admin who also has tokens
    // In this case, the admin themselves might be a user
    const { data: tokenData } = await supabaseAdmin
      .from("invite_tokens")
      .select("used_by_telegram_id")
      .eq("admin_id", authId)
      .eq("token_type", "admin")
      .not("used_by_telegram_id", "is", null)
      .limit(1)
      .single();

    if (tokenData?.used_by_telegram_id) {
      return NextResponse.json({ telegramId: tokenData.used_by_telegram_id });
    }

    return NextResponse.json({ telegramId: null });
  }

  return NextResponse.json({ telegramId: data.telegram_id });
}
