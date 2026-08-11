import { NextResponse } from "next/server";

// Pages that normal users (sales reps) are allowed to access.
// Everything else in the (dashboard) group is admin-only.
const NORMAL_USER_PAGES = new Set(["/chat"]);

// Pages that are always public (no auth required)
const PUBLIC_PAGES = new Set([
  "/", "/features", "/pricing", "/contact", "/about",
  "/privacy", "/terms", "/refunds",
]);

const AUTH_PAGES = new Set([
  "/login", "/register", "/forgot-password", "/update-password",
]);

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  // ─── 1. Super Admin Security ───────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      const adminCookie = request.cookies.get("super-admin-auth-token");
      if (adminCookie?.value === process.env.SUPER_ADMIN_SECRET) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    const adminCookie = request.cookies.get("super-admin-auth-token");
    if (adminCookie?.value !== process.env.SUPER_ADMIN_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ─── 2. Auth check ─────────────────────────────────────────
  const allCookies = request.cookies.getAll();
  const authCookie = allCookies.find((c) => c.name.startsWith("sb-"));
  const isAuthPage = AUTH_PAGES.has(pathname);
  const isPublicPage = PUBLIC_PAGES.has(pathname);

  // Not logged in + trying to access a protected page → login
  if (!authCookie && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in + on an auth page → redirect to their home
  if (authCookie && isAuthPage) {
    const role = request.cookies.get("salesji-user-role")?.value;
    if (role === "user") {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ─── 3. Normal user guard ──────────────────────────────────
  // If logged in as a normal user (role cookie = "user") and trying
  // to access admin dashboard pages → bounce them to /chat.
  if (authCookie && !isPublicPage && !isAuthPage) {
    const role = request.cookies.get("salesji-user-role")?.value;
    if (role === "user" && !NORMAL_USER_PAGES.has(pathname)) {
      return NextResponse.redirect(new URL("/chat", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf)$).*)",
  ],
};
