"use server";

import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Ensures an admin user has an admin-type invite token.
 * Uses the Supabase REST API (service role) instead of a direct Postgres
 * connection to avoid ECONNREFUSED issues with the connection pooler.
 */
export async function ensureAdminToken(userId) {
  try {
    // Check if an admin token already exists for this user
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("invite_tokens")
      .select("id")
      .eq("admin_id", userId)
      .eq("token_type", "admin")
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error("ensureAdminToken select error:", selectError.message);
      return;
    }

    // Already has one — nothing to do
    if (existing) return;

    // Create a new admin token
    const adminTokenString = `admin_${Math.random().toString(36).substr(2, 9)}`;
    const botUsername = "salesji_bot";
    const link = `https://t.me/${botUsername}?start=${adminTokenString}`;

    const { error: insertError } = await supabaseAdmin
      .from("invite_tokens")
      .insert({
        token_string: link,
        admin_id: userId,
        token_type: "admin",
        is_used: false,
        is_revoked: false,
      });

    if (insertError) {
      console.error("ensureAdminToken insert error:", insertError.message);
    }
  } catch (err) {
    console.error("ensureAdminToken failed:", err);
  }
}

/**
 * Returns all invite tokens for a given admin, newest first.
 * Uses the Supabase REST API (service role).
 */
export async function getAllTokens(userId) {
  const { data, error } = await supabaseAdmin
    .from("invite_tokens")
    .select("*")
    .eq("admin_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getAllTokens error:", error.message);
    return [];
  }
  return data || [];
}
