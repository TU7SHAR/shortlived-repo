"use server";

import { db } from "../../db";
import { inviteTokens } from "../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function ensureAdminToken(userId) {
  try {
    const existing = await db.query.inviteTokens.findFirst({
      where: and(
        eq(inviteTokens.adminId, userId),
        eq(inviteTokens.tokenType, "admin"),
      ),
    });

    if (existing) return;

    const adminTokenString = `admin_${Math.random().toString(36).substr(2, 9)}`;
    const botUsername =
      process.env.NODE_ENV === "development" ? "devRagbot" : "DrishRag_Bot";
    let link = `https://t.me/${botUsername}?start=${adminTokenString}`;

    await db.insert(inviteTokens).values({
      tokenString: link,
      adminId: userId,
      tokenType: "admin",
    });
  } catch (err) {
    console.error(err);
  }
}

export async function getAllTokens(userId) {
  const { data, error } = await supabase
    .from("invite_tokens")
    .select("*")
    .eq("admin_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }
  return data;
}
