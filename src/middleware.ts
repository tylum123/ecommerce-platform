import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
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

    // Authenticated users proceed to /quan-tri:
    // - Staff & Admin roles render the full AdminErpView.
    // - Customer role renders AdminAccessDenied with Permission Matrix and 1-Click Role Switcher.
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
