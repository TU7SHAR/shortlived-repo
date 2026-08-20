import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The Python RAG service (same engine the Telegram bot uses).
// Runs on the same server; override with PY_CHAT_URL if needed.
const PY_CHAT_URL = process.env.PY_CHAT_URL || "http://127.0.0.1:8001/chat";

// ═══════════════════════════════════════════════════════
// WEB CHAT — thin proxy to the Python RAG engine
// The frontend only handles: auth → admin resolution →
// forward to Python → persist history. No AI logic here.
// ═══════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const { message, conversationId, authId, mode } = await request.json();

    if (!message || !authId) {
      return NextResponse.json(
        { error: "Message and authId are required" },
        { status: 400 }
      );
    }

    // 1. Resolve this user's tenant admin_id.
    //    Users are in authorized_users (unified); admins own their own data.
    let adminId = null;
    let telegramId = null;

    const { data: authUser } = await supabaseAdmin
      .from("authorized_users")
      .select("admin_id, telegram_id")
      .eq("web_user_id", authId)
      .maybeSingle();

    if (authUser?.admin_id) {
      adminId = authUser.admin_id;
      telegramId = authUser.telegram_id || null;
    } else {
      // Treat the auth user as an admin (their id IS the admin_id)
      adminId = authId;
    }

    if (!adminId) {
      return NextResponse.json(
        { error: "Could not resolve your account. Contact your admin." },
        { status: 403 }
      );
    }

    // 2. Forward to the Python RAG engine (same brain as Telegram)
    //    web_user_id is the Supabase auth UUID — needed for stateful
    //    flows (onboarding, training, testing) that persist step state.
    let aiResponse;
    try {
      const pyRes = await fetch(PY_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          message,
          web_user_id: authId,
          telegram_id: telegramId,
          mode: mode || "assistant",
        }),
      });

      if (!pyRes.ok) {
        throw new Error(`Python chat service returned ${pyRes.status}`);
      }

      const data = await pyRes.json();
      aiResponse = data.response || "I couldn't generate a response right now.";
    } catch (e) {
      console.error("[/api/chat] Python service error:", e);
      return NextResponse.json(
        { error: "The assistant is temporarily unavailable. Please try again shortly." },
        { status: 502 }
      );
    }

    // 3. Persist to unified chat history
    if (conversationId) {
      await supabaseAdmin.from("chat_messages").insert([
        {
          conversation_id: conversationId,
          user_id: authId,
          admin_id: adminId,
          role: "user",
          content: message,
          platform: "web",
        },
        {
          conversation_id: conversationId,
          user_id: authId,
          admin_id: adminId,
          role: "assistant",
          content: aiResponse,
          platform: "web",
        },
      ]);
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to process message. Please try again." },
      { status: 500 }
    );
  }
}
