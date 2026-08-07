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
    //    Web users are mapped in web_chat_users; admins own their own data.
    let adminId = null;
    let telegramId = null;

    const { data: webUser } = await supabaseAdmin
      .from("web_chat_users")
      .select("admin_id, telegram_id")
      .eq("id", authId)
      .maybeSingle();

    if (webUser?.admin_id) {
      adminId = webUser.admin_id;
      telegramId = webUser.telegram_id || null;
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
    let aiResponse;
    try {
      const pyRes = await fetch(PY_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_id: adminId,
          message,
          user_id: authId,
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

    // 3. Persist to web chat history (analytics is logged by the Python service)
    if (conversationId) {
      await supabaseAdmin.from("web_chat_messages").insert([
        {
          conversation_id: conversationId,
          user_id: authId,
          telegram_id: telegramId,
          admin_id: adminId,
          role: "user",
          content: message,
        },
        {
          conversation_id: conversationId,
          user_id: authId,
          telegram_id: telegramId,
          admin_id: adminId,
          role: "assistant",
          content: aiResponse,
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
