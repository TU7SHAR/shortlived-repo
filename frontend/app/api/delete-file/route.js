import { NextResponse } from "next/server";
import { DB } from "@/app/lib/schema_map";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

export async function POST(req) {
  try {
    const body = await req.json();
    const { fileId, filename } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 },
      );
    }

    console.log(`Starting deep cleanup for file: ${filename} (${fileId})`);

    // 1. Clean up CONDENSED CARDS and their child tables (Chunks & Anchors)
    const { data: cards } = await supabaseAdmin
      .from(DB.CONDENSED_CARDS.TABLE)
      .select("id")
      .eq(DB.CONDENSED_CARDS.FILE_ID, fileId);

    if (cards && cards.length > 0) {
      const cardIds = cards.map((c) => c.id);
      await supabaseAdmin
        .from(DB.KNOWLEDGE_CARD_CHUNKS.TABLE)
        .delete()
        .in(DB.KNOWLEDGE_CARD_CHUNKS.CARD_ID, cardIds);
      await supabaseAdmin
        .from(DB.ASYMMETRIC_ANCHORS.TABLE)
        .delete()
        .in(DB.ASYMMETRIC_ANCHORS.CARD_ID, cardIds);
      await supabaseAdmin
        .from(DB.CONDENSED_CARDS.TABLE)
        .delete()
        .in(DB.CONDENSED_CARDS.ID, cardIds);
    }

    // 2. Clean up FILE CHUNKS and their related EMBEDDINGS
    const { data: chunks } = await supabaseAdmin
      .from(DB.FILE_CHUNKS.TABLE)
      .select("id")
      .eq(DB.FILE_CHUNKS.FILE_ID, fileId);

    if (chunks && chunks.length > 0) {
      const chunkIds = chunks.map((c) => c.id);
      await supabaseAdmin
        .from(DB.EMBEDDINGS.TABLE)
        .delete()
        .in(DB.EMBEDDINGS.CHUNK_ID, chunkIds);
      await supabaseAdmin
        .from(DB.FILE_CHUNKS.TABLE)
        .delete()
        .in(DB.FILE_CHUNKS.ID, chunkIds);
    }

    // 3. Clean up CONDENSATION LOGS
    await supabaseAdmin
      .from(DB.CONDENSATION_LOGS.TABLE)
      .delete()
      .eq(DB.CONDENSATION_LOGS.FILE_ID, fileId);

    // 4. FINALLY, Delete the main INGESTED FILE record
    const { error: fileError } = await supabaseAdmin
      .from(DB.FILES.TABLE)
      .delete()
      .eq(DB.FILES.ID, fileId);

    if (fileError) throw fileError;

    return NextResponse.json({
      success: true,
      message: "File and all dependencies deleted.",
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
