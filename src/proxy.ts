import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSession, isSupabaseSessionConfigured } from "@/lib/server/supabase-session";
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from "@/lib/auth";

async function refreshSupabaseSessionResponse(request: NextRequest): Promise<NextResponse> {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  try {
    session = createSupabaseSession(request);
    await session.client.auth.getUser();
  } catch {
    /* Server pages enforce their own closed or redirect state when unavailable. */
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  if (session) {
    for (const [name, value] of session.response.headers) {
      if (name.toLowerCase() !== "set-cookie" && name.toLowerCase() !== "content-type") {
        response.headers.set(name, value);
      }
    }
    for (const cookie of session.response.cookies.getAll()) {
      response.cookies.set(cookie);
    }
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isStaffOrCatalogSupabaseRoute =
    pathname === "/quan-tri/san-pham" || pathname === "/nhan-vien" || pathname.startsWith("/nhan-vien/");
  const isCustomerRoute = pathname === "/khach-hang" || pathname.startsWith("/khach-hang/");

  // Pages own their authoritative auth and role gates; proxy only refreshes cookies optimistically.
  if (
    isStaffOrCatalogSupabaseRoute ||
    (isCustomerRoute && typeof isSupabaseSessionConfigured === "function" && isSupabaseSessionConfigured())
  ) {
    return refreshSupabaseSessionResponse(request);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]+)`));
  let token: string | null = null;
  if (match) {
    try {
      token = decodeURIComponent(match[1]);
    } catch {
      token = null;
    }
  }

  const session = token ? await verifySignedSessionToken(token) : null;

  // 1. Protect Admin ERP Portal: /quan-tri and subroutes
  if (pathname.startsWith("/quan-tri")) {
    if (!session) {
      const loginUrl = new URL("/dang-nhap", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
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
  matcher: ["/quan-tri/:path*", "/khach-hang/:path*", "/nhan-vien/:path*"],
};
