import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Resolve a logged-in user's chat context from their Supabase auth id.
// Returns { adminId, role, telegramId } so /chat knows which tenant's
// knowledge base to use.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const authId = searchParams.get("authId");

  if (!authId) {
    return NextResponse.json({ error: "authId required" }, { status: 400 });
  }

  // 1. Is this a mapped web-chat user (normal user invited by an admin)?
  const { data: webUser } = await supabaseAdmin
    .from("web_chat_users")
    .select("admin_id, role, telegram_id")
    .eq("id", authId)
    .maybeSingle();

  if (webUser?.admin_id) {
    return NextResponse.json({
      adminId: webUser.admin_id,
      role: webUser.role || "user",
      telegramId: webUser.telegram_id || null,
    });
  }

  // 2. Otherwise, treat them as an admin (tenant owner). Their own auth id
  //    IS the admin_id used across all tenant data.
  const { data: ownTokens } = await supabaseAdmin
    .from("invite_tokens")
    .select("id")
    .eq("admin_id", authId)
    .limit(1);

  if (ownTokens && ownTokens.length > 0) {
    return NextResponse.json({
      adminId: authId,
      role: "admin",
      telegramId: null,
    });
  }

  // 3. Fallback: an admin with no tokens yet still owns their own data
  return NextResponse.json({
    adminId: authId,
    role: "admin",
    telegramId: null,
  });
}
