import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Load conversations for a user (unified table)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data: conversations, error } = await supabaseAdmin
    .from("chat_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: conversations || [] });
}

// POST: Create a new conversation
export async function POST(request) {
  const { userId, adminId, title, mode } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("chat_conversations")
    .insert({
      user_id: userId,
      admin_id: adminId || userId,
      title: title || "New Chat",
      mode: mode || "assistant",
      platform: "web",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data });
}

// DELETE: Delete a conversation (cascades messages)
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("id");

  if (!conversationId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
