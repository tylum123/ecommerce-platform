import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseSession } from "@/lib/server/supabase-session";
import {
  AUTH_COOKIE_NAME,
  verifySignedSessionToken,
} from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // These pages own their provisioned-role gates; middleware only refreshes cookies.
  if (pathname === "/quan-tri/san-pham" || pathname === "/nhan-vien" || pathname.startsWith("/nhan-vien/")) {
    let session: ReturnType<typeof createSupabaseSession> | undefined;
    try {
      session = createSupabaseSession(request);
      await session.client.auth.getUser();
    } catch { /* The server page renders a closed state when unavailable. */ }
    const response = NextResponse.next({ request: { headers: request.headers } });
    if (session) {
      for (const [name, value] of session.response.headers) if (name.toLowerCase() !== "set-cookie" && name.toLowerCase() !== "content-type") response.headers.set(name, value);
      for (const cookie of session.response.cookies.getAll()) response.cookies.set(cookie);
    }
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  }
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
    "/nhan-vien/:path*",
  ],
};
