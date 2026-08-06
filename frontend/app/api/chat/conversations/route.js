import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Load conversations for a user
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: conversations, error } = await supabaseAdmin
    .from("web_chat_conversations")
    .select("*")
    .eq("telegram_id", parseInt(userId))
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: conversations || [] });
}

// POST: Create a new conversation
export async function POST(request) {
  const { userId, title } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  // Get admin_id
  const { data: user } = await supabaseAdmin
    .from("authorized_users")
    .select("admin_id")
    .eq("telegram_id", parseInt(userId))
    .single();

  const { data, error } = await supabaseAdmin
    .from("web_chat_conversations")
    .insert({
      telegram_id: parseInt(userId),
      admin_id: user?.admin_id,
      title: title || "New Chat",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}

// DELETE: Delete a conversation
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("id");

  if (!conversationId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  // Delete messages first
  await supabaseAdmin
    .from("web_chat_messages")
    .delete()
    .eq("conversation_id", conversationId);

  const { error } = await supabaseAdmin
    .from("web_chat_conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
