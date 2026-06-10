"use server";

import { cookies } from "next/headers";

export async function clearUserCookies() {
  const cookieStore = await cookies();

  // 1. Explicitly delete your custom auth token
  cookieStore.delete("sb-access-auth-token");

  // 2. Safely find and delete any other Supabase-related cookies
  const allCookies = cookieStore.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
      cookieStore.delete(cookie.name);
    }
  }

  return true;
}
