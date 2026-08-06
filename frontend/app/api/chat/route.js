import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════
// SYSTEM PROMPT - Replicates the Telegram bot's behavior
// ═══════════════════════════════════════════════════════
const SYSTEM_PROMPT = `You are Salesji, an expert internal Sales Assistant for this company.
Your ONLY source of truth is the CONTEXT provided below.

CRITICAL INSTRUCTIONS:
1. You MUST answer the user's question using ONLY the provided CONTEXT.
2. If the answer cannot be found in the CONTEXT, you MUST refuse to answer and say exactly: "I do not have information on that in the company knowledge base."
3. DO NOT use outside world knowledge. DO NOT guess, infer, or make up information.
4. Always mention the source file(s) you used at the very end of your answer in a new line (e.g., "Source: [filename]").
5. Keep sentences punchy, readable, and formatted for quick scanning.
6. Use numbers like 1), 2), 3) for lists.
7. When discussing competitors, ALWAYS pitch OUR products first.
8. Translate features into ROI benefits for the sales rep.
9. Provide word-for-word scripts the rep can use when possible.`;

// ═══════════════════════════════════════════════════════
// MAIN CHAT HANDLER
// ═══════════════════════════════════════════════════════
export async function POST(request) {
  try {
    const { message, conversationId, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      );
    }

    // 1. Get user's admin_id from authorized_users
    const { data: userData } = await supabaseAdmin
      .from("authorized_users")
      .select("admin_id, telegram_id")
      .eq("telegram_id", userId)
      .single();

    if (!userData || !userData.admin_id) {
      return NextResponse.json(
        { error: "User not authorized or no admin linked" },
        { status: 403 }
      );
    }

    const adminId = userData.admin_id;

    // 2. Check maintenance mode
    const { data: settings } = await supabaseAdmin
      .from("bot_settings")
      .select("maintenance_mode, temperature, strict_knowledge_mode")
      .eq("admin_id", adminId)
      .single();

    if (settings?.maintenance_mode) {
      return NextResponse.json({
        response: "The system is currently in maintenance mode. Please check back later.",
        isMaintenanceMode: true,
      });
    }

    const temperature = settings?.temperature || 0.2;

    // 3. Load Knowledge Base (condensed knowledge cards)
    const { data: files } = await supabaseAdmin
      .from("ingested_files")
      .select("id, filename, category")
      .eq("admin_id", adminId);

    let fullContext = "";
    let hasData = false;

    if (files && files.length > 0) {
      let ourProducts = "";
      let competitors = "";
      let priceLists = "";

      for (const file of files) {
        const { data: cards } = await supabaseAdmin
          .from("condensed_knowledge_cards")
          .select("card_json")
          .eq("file_id", file.id);

        if (!cards || cards.length === 0) continue;

        const cardText = cards
          .map((c) => (typeof c.card_json === "object" ? JSON.stringify(c.card_json) : c.card_json))
          .join("\n");

        if (!cardText.trim()) continue;

        if (file.category === "Our Products") {
          ourProducts += `\n\n--- OUR PRODUCT FILE: ${file.filename} ---\n${cardText}`;
        } else if (file.category === "Competitor Products") {
          competitors += `\n\n--- COMPETITOR FILE: ${file.filename} ---\n${cardText}`;
        } else if (file.category === "Price Lists") {
          priceLists += `\n\n--- PRICE LIST FILE: ${file.filename} ---\n${cardText}`;
        }
      }

      if (ourProducts) {
        fullContext += "\n\n=== OUR COMPANY'S PRODUCTS (PITCH THESE FIRST) ===" + ourProducts;
        hasData = true;
      }
      if (priceLists) {
        fullContext += "\n\n=== OUR PRICE LISTS ===" + priceLists;
        hasData = true;
      }
      if (competitors) {
        fullContext += "\n\n=== COMPETITOR DATA (USE ONLY TO COUNTER) ===" + competitors;
        hasData = true;
      }
    }

    // 4. Vector Search (if inline context is small)
    if (!hasData || fullContext.length < 2000) {
      const vectorResults = await vectorSearch(message, adminId);
      if (vectorResults && vectorResults.length > 0) {
        hasData = true;
        fullContext += "\n\n=== RELEVANT VECTOR SEARCH RESULTS ===\n";
        vectorResults.forEach((r, i) => {
          fullContext += `\n[Result ${i + 1}]: ${r.content}\n`;
        });
      }
    }

    if (!hasData) {
      return NextResponse.json({
        response: "The knowledge base is currently empty. Please ask an Admin to upload documents first.",
      });
    }

    // 5. Truncate context if too long
    const MAX_CONTEXT = 100000;
    if (fullContext.length > MAX_CONTEXT) {
      fullContext = fullContext.slice(0, MAX_CONTEXT) + "\n... [Context truncated]";
    }

    // 6. Call LLM (Gemini)
    const aiResponse = await callGemini(message, fullContext, temperature);

    // 7. Log the interaction
    await supabaseAdmin.from("chat_analytics").insert({
      telegram_id: parseInt(userId),
      user_query: message,
      bot_response: aiResponse,
      admin_id: adminId,
      mode: "normal",
    });

    // 8. Save to web chat history
    if (conversationId) {
      await supabaseAdmin.from("web_chat_messages").insert([
        {
          conversation_id: conversationId,
          telegram_id: parseInt(userId),
          admin_id: adminId,
          role: "user",
          content: message,
        },
        {
          conversation_id: conversationId,
          telegram_id: parseInt(userId),
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

// ═══════════════════════════════════════════════════════
// VECTOR SEARCH via Supabase RPC
// ═══════════════════════════════════════════════════════
async function vectorSearch(query, adminId) {
  try {
    // Generate embedding via Gemini embedding API
    const embedding = await getEmbedding(query);
    if (!embedding) return [];

    const { data, error } = await supabaseAdmin.rpc("match_embeddings", {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 5,
      p_admin_id: adminId,
    });

    if (error || !data) return [];

    return data.map((match) => ({
      content: match.content || match.source_text || "",
      similarity: match.similarity,
    }));
  } catch (e) {
    console.error("[Vector Search] Error:", e);
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// EMBEDDING GENERATION via Gemini
// ═══════════════════════════════════════════════════════
async function getEmbedding(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[Embedding] No GEMINI_API_KEY, skipping vector search");
      return null;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_QUERY",
        }),
      }
    );

    const data = await response.json();
    return data?.embedding?.values || null;
  } catch (e) {
    console.error("[Embedding] Error:", e);
    return null;
  }
}

// ═══════════════════════════════════════════════════════
// LLM CALL - Google Gemini
// ═══════════════════════════════════════════════════════
async function callGemini(userMessage, context, temperature = 0.2) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Fallback: try Groq
    return callGroq(userMessage, context, temperature);
  }

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: fullSystemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  const data = await response.json();

  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return cleanResponse(data.candidates[0].content.parts[0].text);
  }

  // Fallback to Groq if Gemini fails
  return callGroq(userMessage, context, temperature);
}

// ═══════════════════════════════════════════════════════
// FALLBACK LLM - Groq
// ═══════════════════════════════════════════════════════
async function callGroq(userMessage, context, temperature = 0.2) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("No LLM API key available (neither GEMINI nor GROQ)");

  const fullSystemPrompt = `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: fullSystemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: 4096,
    }),
  });

  const data = await response.json();
  return cleanResponse(data?.choices?.[0]?.message?.content || "I apologize, but I encountered an error.");
}

// ═══════════════════════════════════════════════════════
// RESPONSE CLEANING
// ═══════════════════════════════════════════════════════
function cleanResponse(text) {
  let cleaned = text;
  // Remove <think> tags
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "");
  // Remove markdown headers
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");
  // Remove bold markdown
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, "$1");
  // Remove italic markdown
  cleaned = cleaned.replace(/\*(.+?)\*/g, "$1");
  // Remove code backticks
  cleaned = cleaned.replace(/`(.+?)`/g, "$1");
  return cleaned.trim();
}
