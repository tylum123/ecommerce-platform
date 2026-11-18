import { serializeClearSessionCookie } from "@/lib/auth";
import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";
import { NextRequest } from "next/server";
import { isSupabaseSessionConfigured } from "@/lib/server/supabase-session";
import { POST as sessionPost } from "@/app/api/session/route";

export const dynamic = "force-dynamic";

// Legacy JWTs, demo passwords and client roles are never accepted as identity.
// A maintained provider and durable sessions must be integrated before enabling login.
export async function GET() {
  const response = authenticationRequired();
  response.headers.set("Set-Cookie", serializeClearSessionCookie());
  return response;
}

export async function POST(request: Request) {
  const body: unknown = await request.clone().json().catch(() => null);
  const action = new URL(request.url).searchParams.get("action") ||
    (body && typeof body === "object" && "action" in body ? body.action : null);

  if (action === "logout") {
    if (isSupabaseSessionConfigured()) {
      const logout = new NextRequest(request.url, { method: "POST", headers: {
        "Content-Type": "application/json",
        "Origin": request.headers.get("origin") || "",
        "Cookie": request.headers.get("cookie") || "",
      }, body: JSON.stringify({ action: "logout" }) });
      const result = await sessionPost(logout);
      const payload: unknown = await result.json();
      const success = result.ok && !!payload && typeof payload === "object" && "ok" in payload && payload.ok === true;
      return Response.json({ success }, { status: result.status, headers: result.headers });
    }
    // All legacy sessions are invalidated server-side by the disabled verifier.
    const response = Response.json({ success: true }, {
      headers: { "Cache-Control": "private, no-store" },
    });
    response.headers.set("Set-Cookie", serializeClearSessionCookie());
    return response;
  }

  return serviceUnavailable();
}
