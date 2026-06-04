import { NextResponse } from "next/server";

export default function proxy(request) {
  const { pathname } = request.nextUrl;

  // 1. Admin Security Check
  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get("super-admin-auth-token");
    const isAuthenticatedAdmin =
      adminCookie?.value === process.env.SUPER_ADMIN_SECRET;

    if (!isAuthenticatedAdmin) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  const allCookies = request.cookies.getAll();
  const authCookie = allCookies.find((c) => c.name.startsWith("sb-"));

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/update-password";

  const isPublicPage =
    pathname === "/" ||
    pathname === "/features" ||
    pathname === "/pricing" ||
    pathname === "/contact" ||
    pathname === "/about";

  if (!authCookie && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 4. Logic: Redirect to dashboard if logged in and trying to access login page
  if (authCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf)$).*)",
  ],
};
