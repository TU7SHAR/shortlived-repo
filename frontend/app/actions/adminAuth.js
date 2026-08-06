"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../lib/supabaseAdmin";

// ═══════════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════════

export async function trySuperAdminLogin(email, password) {
  if (
    email === process.env.SUPER_ADMIN_USERNAME &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    const cookieStore = await cookies();
    cookieStore.set("super-admin-auth-token", process.env.SUPER_ADMIN_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    });

    // Log the login
    await logAuditAction("LOGIN", "session", null, { ip: "server" });

    return { isAdmin: true };
  }

  return { isAdmin: false };
}

export async function logoutSuperAdmin() {
  await logAuditAction("LOGOUT", "session", null, {});
  const cookieStore = await cookies();
  cookieStore.delete("super-admin-auth-token");
  redirect("/admin/login");
}

// ═══════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════

export async function logAuditAction(action, entity_type, entity_id, metadata = {}) {
  try {
    await supabaseAdmin.from("super_admin_audit_logs").insert({
      action,
      entity_type,
      entity_id: entity_id ? String(entity_id) : null,
      metadata,
      performed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Audit Log] Failed to log action:", err);
  }
}

// ═══════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════

export async function banUser(telegramId) {
  const { error } = await supabaseAdmin
    .from("authorized_users")
    .update({ is_banned: true })
    .eq("telegram_id", telegramId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("BAN_USER", "authorized_users", telegramId, {
    telegram_id: telegramId,
  });

  return { success: true };
}

export async function unbanUser(telegramId) {
  const { error } = await supabaseAdmin
    .from("authorized_users")
    .update({ is_banned: false })
    .eq("telegram_id", telegramId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("UNBAN_USER", "authorized_users", telegramId, {
    telegram_id: telegramId,
  });

  return { success: true };
}

export async function deleteUser(telegramId) {
  const { error } = await supabaseAdmin
    .from("authorized_users")
    .delete()
    .eq("telegram_id", telegramId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("DELETE_USER", "authorized_users", telegramId, {
    telegram_id: telegramId,
  });

  return { success: true };
}

// ═══════════════════════════════════════════════════════
// TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════

export async function revokeToken(tokenId) {
  const { error } = await supabaseAdmin
    .from("invite_tokens")
    .update({ is_revoked: true })
    .eq("id", tokenId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("REVOKE_TOKEN", "invite_tokens", tokenId, {});

  return { success: true };
}

export async function bulkRevokeTokens(tokenIds) {
  const { error } = await supabaseAdmin
    .from("invite_tokens")
    .update({ is_revoked: true })
    .in("id", tokenIds);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("BULK_REVOKE_TOKENS", "invite_tokens", null, {
    count: tokenIds.length,
    token_ids: tokenIds,
  });

  return { success: true };
}

export async function deleteToken(tokenId) {
  const { error } = await supabaseAdmin
    .from("invite_tokens")
    .delete()
    .eq("id", tokenId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("DELETE_TOKEN", "invite_tokens", tokenId, {});

  return { success: true };
}

// ═══════════════════════════════════════════════════════
// KNOWLEDGE BASE / FILE MANAGEMENT
// ═══════════════════════════════════════════════════════

export async function deleteIngestedFile(fileId) {
  // Delete related records first (cascade should handle it, but be explicit)
  await supabaseAdmin
    .from("condensed_knowledge_cards")
    .delete()
    .eq("file_id", fileId);

  await supabaseAdmin
    .from("file_chunks")
    .delete()
    .eq("file_id", fileId);

  const { error } = await supabaseAdmin
    .from("ingested_files")
    .delete()
    .eq("id", fileId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("DELETE_FILE", "ingested_files", fileId, {});

  return { success: true };
}

export async function bulkDeleteFiles(fileIds) {
  for (const fileId of fileIds) {
    await supabaseAdmin
      .from("condensed_knowledge_cards")
      .delete()
      .eq("file_id", fileId);
    await supabaseAdmin
      .from("file_chunks")
      .delete()
      .eq("file_id", fileId);
  }

  const { error } = await supabaseAdmin
    .from("ingested_files")
    .delete()
    .in("id", fileIds);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("BULK_DELETE_FILES", "ingested_files", null, {
    count: fileIds.length,
    file_ids: fileIds,
  });

  return { success: true };
}

// ═══════════════════════════════════════════════════════
// TENANT / BOT SETTINGS MANAGEMENT
// ═══════════════════════════════════════════════════════

export async function toggleMaintenanceMode(adminId, enabled) {
  const { error } = await supabaseAdmin
    .from("bot_settings")
    .update({ maintenance_mode: enabled, updated_at: new Date().toISOString() })
    .eq("admin_id", adminId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction(
    enabled ? "ENABLE_MAINTENANCE" : "DISABLE_MAINTENANCE",
    "bot_settings",
    adminId,
    { admin_id: adminId }
  );

  return { success: true };
}

export async function updateBotSettings(adminId, settings) {
  const { error } = await supabaseAdmin
    .from("bot_settings")
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq("admin_id", adminId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("UPDATE_SETTINGS", "bot_settings", adminId, {
    admin_id: adminId,
    changes: settings,
  });

  return { success: true };
}

export async function setGlobalMaintenance(enabled) {
  const { error } = await supabaseAdmin
    .from("bot_settings")
    .update({ maintenance_mode: enabled, updated_at: new Date().toISOString() })
    .neq("id", 0); // Update all rows

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction(
    enabled ? "GLOBAL_MAINTENANCE_ON" : "GLOBAL_MAINTENANCE_OFF",
    "bot_settings",
    null,
    {}
  );

  return { success: true };
}

// ═══════════════════════════════════════════════════════
// ANALYTICS ACTIONS
// ═══════════════════════════════════════════════════════

export async function deleteChatLogs(logIds) {
  const { error } = await supabaseAdmin
    .from("chat_analytics")
    .delete()
    .in("id", logIds);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("DELETE_CHAT_LOGS", "chat_analytics", null, {
    count: logIds.length,
  });

  return { success: true };
}

export async function purgeOldAnalytics(daysOld) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  const { error, count } = await supabaseAdmin
    .from("chat_analytics")
    .delete({ count: "exact" })
    .lt("created_at", cutoff.toISOString());

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditAction("PURGE_ANALYTICS", "chat_analytics", null, {
    days_old: daysOld,
    records_deleted: count,
  });

  return { success: true, deleted: count };
}
