import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie") || "";

  // Extract session token from cookie
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  // Verify signed session payload using Web Crypto API
  const session = token ? await verifySignedSessionToken(token) : null;

  // 1. Protect Admin ERP Portal: /quan-tri and subroutes
  if (pathname.startsWith("/quan-tri")) {
    if (!session) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }

    if (!isStaffOrAdminRole(session.role)) {
      const customerUrl = new URL("/khach-hang/tai-khoan", request.url);
      customerUrl.searchParams.set("error", "access_denied_admin_only");
      return NextResponse.redirect(customerUrl);
    }

    return NextResponse.next();
  }

  // 2. Protect Customer Portal: /khach-hang and subroutes
  if (pathname.startsWith("/khach-hang")) {
    if (!session) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "login_required");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/quan-tri/:path*",
    "/khach-hang/:path*",
  ],
};
