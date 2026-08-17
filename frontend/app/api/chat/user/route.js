import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Resolve a logged-in user's chat context from their Supabase auth id.
// Looks up authorized_users by web_user_id (the unified user table).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authId = searchParams.get("authId");

  if (!authId) {
    return NextResponse.json({ error: "authId required" }, { status: 400 });
  }

  // 1. Check authorized_users for this web_user_id
  const { data: user } = await supabaseAdmin
    .from("authorized_users")
    .select("id, admin_id, telegram_id, web_user_id")
    .eq("web_user_id", authId)
    .maybeSingle();

  if (user?.admin_id) {
    return NextResponse.json({
      userId: user.id,        // unified user id (uuid)
      adminId: user.admin_id,
      role: "user",
      telegramId: user.telegram_id || null,
    });
  }

  // 2. Maybe they ARE an admin (their auth id = admin_id in invite_tokens)
  const { data: ownTokens } = await supabaseAdmin
    .from("invite_tokens")
    .select("id")
    .eq("admin_id", authId)
    .limit(1);

  if (ownTokens && ownTokens.length > 0) {
    return NextResponse.json({
      userId: authId,
      adminId: authId,
      role: "admin",
      telegramId: null,
    });
  }

  // 3. Fallback: treat as admin (own their own data)
  return NextResponse.json({
    userId: authId,
    adminId: authId,
    role: "admin",
    telegramId: null,
  });
}
