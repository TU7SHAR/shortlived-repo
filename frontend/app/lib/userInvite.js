"use server";

import { supabaseAdmin } from "./supabaseAdmin";
import { sendCredentialsEmail } from "./email";
import { siteConfig } from "../utils/config";

/**
 * Creates a normal-user invite:
 *  1. Generates a random password
 *  2. Creates a Supabase auth user (email confirmed)
 *  3. Maps that user to the admin (tenant) in web_chat_users
 *  4. Creates a Telegram invite token
 *  5. Emails the credentials + Telegram link
 *
 * @param {string} adminId  The tenant admin's auth user id
 * @param {string} email    Recipient email (required)
 * @param {string} caption  Optional label/purpose
 */
export async function createUserInvite(adminId, email, caption) {
  if (!adminId || !email) {
    return { success: false, error: "Admin ID and email are required." };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Generate a readable random password
    const password = generatePassword();

    // 2. Create the Supabase auth user (or reuse if already exists)
    let authUserId = null;
    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
      });

    if (createErr) {
      // If the user already exists, look them up instead of failing
      if (
        createErr.message?.toLowerCase().includes("already") ||
        createErr.status === 422
      ) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existing = list?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );
        if (existing) authUserId = existing.id;
      }
      if (!authUserId) {
        return { success: false, error: createErr.message };
      }
    } else {
      authUserId = created?.user?.id;
    }

    // 3. Register this user in authorized_users (the unified user table)
    await supabaseAdmin.from("authorized_users").upsert(
      {
        web_user_id: authUserId,
        email: cleanEmail,
        admin_id: adminId,
        is_banned: false,
      },
      { onConflict: "web_user_id" }
    );

    // 4. Create a Telegram invite token
    const uniqueToken =
      "token_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const botUsername = siteConfig.botUsername || "salesji_bot";
    const telegramLink = `https://t.me/${botUsername}?start=${uniqueToken}`;

    await supabaseAdmin.from("invite_tokens").insert({
      token_string: telegramLink,
      admin_id: adminId,
      token_type: "user",
      is_used: false,
      is_revoked: false,
      caption: caption || null,
      sent_to: cleanEmail,
    });

    // 5. Email the credentials + telegram link
    const emailResult = await sendCredentialsEmail(
      cleanEmail,
      password,
      telegramLink,
      caption
    );

    return {
      success: true,
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error,
      telegramLink,
    };
  } catch (err) {
    console.error("createUserInvite failed:", err);
    return { success: false, error: err.message };
  }
}

function generatePassword() {
  // 12-char password: letters + digits, easy to type
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 12; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}
