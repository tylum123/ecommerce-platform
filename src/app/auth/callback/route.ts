import { NextResponse, type NextRequest } from "next/server";
import {
  createSupabaseSession,
  isSupabaseSessionConfigured,
  readSupabaseSessionConfig,
} from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sanitizeCallbackNext(rawNext: string | null, origin: string): string {
  const fallback = "/khach-hang/tai-khoan";
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//") || /[\\\r\n\0]/.test(rawNext)) {
    return fallback;
  }
  try {
    const resolved = new URL(rawNext, origin);
    if (resolved.origin !== origin) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  if (!isSupabaseSessionConfigured()) {
    return NextResponse.redirect(new URL("/dang-nhap?reason=unavailable", request.url), {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const config = readSupabaseSessionConfig();
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() || "";
  const safeNext = sanitizeCallbackNext(url.searchParams.get("next"), config.origin);

  if (!code) {
    return NextResponse.redirect(new URL("/dang-nhap?error=callback_invalid", config.origin), {
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  try {
    const session = createSupabaseSession(request, config);
    const { error } = await session.client.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/dang-nhap?error=callback_invalid", config.origin), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }

    const response = NextResponse.redirect(new URL(safeNext, config.origin), {
      headers: { "Cache-Control": "private, no-store" },
    });
    for (const cookie of session.response.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  } catch {
    return NextResponse.redirect(new URL("/dang-nhap?error=callback_invalid", config.origin), {
      headers: { "Cache-Control": "private, no-store" },
    });
  }
}
