"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
      maxAge: 60 * 60 * 24, // 1 day
    });

    return { isAdmin: true };
  }

  return { isAdmin: false };
}

export async function logoutSuperAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("super-admin-auth-token");

  // 2. Add this redirect
  redirect("/login");
}
