import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function readSupabaseSessionConfig() {
  if (process.env.NARI_AUTH_ENABLED !== "true") throw new Error("Local identity is disabled");
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.NARI_SHARED_RATE_LIMIT !== "postgres" || !process.env.NARI_POSTGRES_URL?.trim())
  ) {
    throw new Error("Local identity is disabled");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  const origin = process.env.APP_ORIGIN || "";
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error("Invalid Supabase URL");
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,256}$/.test(key)) throw new Error("Supabase publishable key required");
  const app = new URL(origin);
  if (app.origin !== origin || app.username || app.password) throw new Error("Exact APP_ORIGIN required");
  if (app.protocol !== "https:" && !(["localhost", "127.0.0.1"].includes(app.hostname) && app.protocol === "http:")) throw new Error("HTTPS application origin required");
  return { url, key, origin };
}

export function isSupabaseSessionConfigured(): boolean {
  try { readSupabaseSessionConfig(); return true; } catch { return false; }
}

const privateHeaders = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

/** Route-handler cookie adapter. Response must be returned so refresh cookies survive. */
export function createSupabaseSession(request: NextRequest, config = readSupabaseSessionConfig()) {
  const response = NextResponse.json({ ok: false }, { headers: privateHeaders });
  const client = createServerClient(config.url, config.key, {
    cookieOptions: { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values, headers) => {
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
        for (const { name, value, options } of values) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  return { client, response, config };
}

export function sessionResponse(template: NextResponse, body: object, status = 200) {
  const response = NextResponse.json(body, { status, headers: template.headers });
  // Do not copy the serialized cookie header then append it a second time.
  response.headers.delete("Set-Cookie");
  for (const [name, value] of Object.entries(privateHeaders)) response.headers.set(name, value);
  for (const cookie of template.cookies.getAll()) response.cookies.set(cookie);
  return response;
}

function parseCookieHeader(header: string | null): Array<{ name: string; value: string }> {
  if (!header) return [];
  const pairs: Array<{ name: string; value: string }> = [];
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const rawValue = part.slice(idx + 1).trim();
    if (!name) continue;
    try {
      pairs.push({ name, value: decodeURIComponent(rawValue) });
    } catch {
      pairs.push({ name, value: rawValue });
    }
  }
  return pairs;
}

/** Softly resolve a verified Supabase user ID for guest-or-member endpoints without failing guests. */
export async function resolveOptionalSupabaseUserId(request: Request): Promise<string | null> {
  try {
    const config = readSupabaseSessionConfig();
    const requestCookies =
      "cookies" in request &&
      request.cookies &&
      typeof (request.cookies as { getAll?: unknown }).getAll === "function"
        ? (request.cookies as NextRequest["cookies"]).getAll()
        : parseCookieHeader(request.headers.get("cookie"));
    const client = createServerClient(config.url, config.key, {
      cookieOptions: { httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", path: "/" },
      cookies: {
        getAll: () => requestCookies,
        setAll: () => {},
      },
    });
    const { data, error } = await client.auth.getUser();
    return !error && data.user?.id ? data.user.id : null;
  } catch {
    return null;
  }
}
