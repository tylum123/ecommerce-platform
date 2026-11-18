import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function readSupabaseSessionConfig() {
  // The limiter is process-local in this wave. Production needs a shared limiter.
  if (process.env.NARI_AUTH_ENABLED !== "true" || process.env.NODE_ENV === "production") throw new Error("Local identity is disabled");
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
