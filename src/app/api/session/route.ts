import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSession, readSupabaseSessionConfig, sessionResponse } from "@/lib/server/supabase-session";
import { hasTrustedMutationOrigin } from "@/lib/server/supabase-principal";
import { createSessionRateLimiter, readSessionInput, SessionInputError } from "@/lib/server/session-input";
import { catalogAdminStatus, readCatalogAdminConfig } from "@/lib/server/catalog-admin-access";
import { createIdentityRoleRepository } from "@/lib/server/supabase-principal";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { readStaffPortalConfig, resolveStaffPortalAccess } from "@/lib/server/staff-portal-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limitLogin = createSessionRateLimiter();
async function catalogAccess(session: ReturnType<typeof createSupabaseSession>): Promise<boolean> {
  try {
    readCatalogAdminConfig();
    return await catalogAdminStatus(session.client.auth, createIdentityRoleRepository(getPostgresDatabase())) === 200;
  } catch { return false; }
}
async function staffPortalAccess(session: ReturnType<typeof createSupabaseSession>): Promise<boolean> {
  try {
    readStaffPortalConfig();
    return (await resolveStaffPortalAccess(session.client.auth, createIdentityRoleRepository(getPostgresDatabase()))).status === 200;
  } catch { return false; }
}
function unavailable(template = NextResponse.json({})) {
  return sessionResponse(template, { ok: false, businessAccess: false, error: "Đăng nhập hiện chưa khả dụng. Vui lòng thử lại sau." }, 503);
}

export async function GET(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  try {
    session = createSupabaseSession(request);
    const { data, error } = await session.client.auth.getUser();
    if (error || !data.user) return sessionResponse(session.response, { ok: false, user: null, businessAccess: false }, 401);
    return sessionResponse(session.response, { ok: true, user: { id: data.user.id, email: data.user.email }, businessAccess: false, catalogAccess: await catalogAccess(session), staffPortalAccess: await staffPortalAccess(session) });
  } catch { return unavailable(session?.response); }
}

export async function POST(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  const empty = NextResponse.json({});
  try {
    // Validate configuration and CSRF before reading input or creating a client.
    const config = readSupabaseSessionConfig();
    if (!hasTrustedMutationOrigin(request, config.origin)) {
      return sessionResponse(empty, { ok: false, error: "Yêu cầu không hợp lệ." }, 403);
    }
    const input = await readSessionInput(request);
    if (!("action" in input)) {
      const retryAfter = limitLogin(input.email);
      if (retryAfter) {
        const response = sessionResponse(empty, { ok: false, error: "Đã thử quá nhiều lần. Vui lòng thử lại sau." }, 429);
        response.headers.set("Retry-After", String(retryAfter));
        return response;
      }
    }
    session = createSupabaseSession(request, config);
    if ("action" in input) {
      const { error } = await session.client.auth.signOut({ scope: "local" });
      if (error) return unavailable(session.response);
      session.response.cookies.set("hasaki_session", "", { maxAge: 0, httpOnly: true, secure: config.origin.startsWith("https:"), sameSite: "lax", path: "/" });
      return sessionResponse(session.response, { ok: true, businessAccess: false });
    }
    const { data, error } = await session.client.auth.signInWithPassword(input);
    if (error || !data.user || !data.session) return sessionResponse(session.response, { ok: false, businessAccess: false, error: "Không đăng nhập được. Kiểm tra thông tin hoặc thử lại sau." }, 401);
    return sessionResponse(session.response, { ok: true, businessAccess: false, catalogAccess: await catalogAccess(session), staffPortalAccess: await staffPortalAccess(session) });
  } catch (error) {
    if (error instanceof SessionInputError) return sessionResponse(empty, { ok: false, error: "Thông tin đăng nhập không hợp lệ." }, error.status);
    return unavailable(session?.response);
  }
}
