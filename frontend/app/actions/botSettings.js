"use server";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function toggleMaintenanceMode(newState) {
  // 1. Try to update the existing setting safely
  const { data, error } = await supabaseAdmin
    .from("bot_settings")
    .update({ maintenance_mode: newState })
    .eq("id", 1)
    .select();

  // 2. Fallback: If no row exists yet, insert it
  if (!data || data.length === 0) {
    const { error: insertError } = await supabaseAdmin
      .from("bot_settings")
      .insert([{ id: 1, maintenance_mode: newState }]);

    if (insertError) console.error("Insert Error:", insertError.message);
  }

  if (error) console.error("Update Error:", error.message);

  // Refresh the page data
  revalidatePath("/admin/bot-settings");
}
