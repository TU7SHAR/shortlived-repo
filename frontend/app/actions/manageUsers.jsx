"use server";

import { supabaseAdmin } from "../lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

export async function toggleUserBan(telegramId, currentStatus) {
  // Update the ban status in the authorized_users table
  const { error } = await supabaseAdmin
    .from("authorized_users")
    .update({ is_banned: !currentStatus })
    .eq("telegram_id", telegramId);

  if (error) {
    console.error("Ban Toggle Failed:", error.message);
    return { success: false };
  }

  // Refresh the pages to show the updated status immediately
  revalidatePath("/admin/users");
  revalidatePath("/admin/api-usage");
  return { success: true };
}
