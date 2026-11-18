import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseSession, readSupabaseSessionConfig, sessionResponse } from "@/lib/server/supabase-session";
import { createIdentityRoleRepository, hasTrustedMutationOrigin, resolveSupabasePrincipal, type IdentityRoleRepository, type VerifiedSupabaseAuth } from "@/lib/server/supabase-principal";
import { getPostgresDatabase, postgresPoolConfig } from "@/lib/server/postgres-database";

/** This capability deliberately does not enable legacy ERP, orders or customer data. */
export function readCatalogAdminConfig() {
  if (process.env.NARI_CATALOG_ADMIN_ENABLED !== "true" || process.env.NARI_CATALOG_BACKEND !== "postgres") throw new Error("CATALOG_ADMIN_DISABLED");
  const config = readSupabaseSessionConfig(); // Retains the production/shared-limiter blocker.
  postgresPoolConfig();
  return config;
}

export async function catalogAdminStatus(auth: VerifiedSupabaseAuth, identities: IdentityRoleRepository): Promise<200 | 401 | 403> {
  const principal = await resolveSupabasePrincipal(auth, identities);
  return !principal ? 401 : principal.role === "admin" ? 200 : 403;
}

export async function authorizeCatalogRequest(request: NextRequest) {
  let template = NextResponse.json({});
  try {
    const config = readCatalogAdminConfig();
    if (!["GET", "HEAD"].includes(request.method) && !hasTrustedMutationOrigin(request, config.origin)) {
      return { template, response: sessionResponse(template, { ok: false, code: "INVALID_ORIGIN", error: "Yêu cầu không hợp lệ." }, 403) };
    }
    const session = createSupabaseSession(request, config);
    template = session.response;
    const status = await catalogAdminStatus(session.client.auth, createIdentityRoleRepository(getPostgresDatabase()));
    if (status !== 200) return { template, response: sessionResponse(template, { ok: false, code: status === 401 ? "AUTHENTICATION_REQUIRED" : "FORBIDDEN", error: status === 401 ? "Vui lòng đăng nhập bằng tài khoản được cấp quyền." : "Bạn không có quyền quản lý danh mục." }, status) };
    return { template, response: null };
  } catch {
    return { template, response: sessionResponse(template, { ok: false, code: "CATALOG_ADMIN_UNAVAILABLE", error: "Quản lý danh mục hiện chưa khả dụng." }, 503) };
  }
}
