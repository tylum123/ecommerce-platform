import "server-only";
import type { NextRequest } from "next/server";
import type { AuthSessionUser } from "@/lib/auth";
import { isStaffOrAdminRole } from "@/lib/auth";
import { createSupabaseSession, readSupabaseSessionConfig } from "@/lib/server/supabase-session";
import { createIdentityRoleRepository, resolveSupabasePrincipal, type IdentityRoleRepository, type VerifiedSupabaseAuth } from "@/lib/server/supabase-principal";
import { getPostgresDatabase, postgresPoolConfig } from "@/lib/server/postgres-database";

/** Screen access only: this never enables a legacy ERP or business-data capability. */
export function readStaffPortalConfig() {
  if (process.env.NARI_STAFF_PORTAL_ENABLED !== "true") throw new Error("STAFF_PORTAL_DISABLED");
  const config = readSupabaseSessionConfig(); // Retains production/shared-limiter restriction.
  postgresPoolConfig();
  return config;
}

type StaffPortalAccess = { status: 200; user: AuthSessionUser } | { status: 401 | 403 | 503; user: null };

export async function resolveStaffPortalAccess(auth: VerifiedSupabaseAuth, identities: IdentityRoleRepository): Promise<StaffPortalAccess> {
  const user = await resolveSupabasePrincipal(auth, identities);
  if (!user) return { status: 401, user: null };
  if (!isStaffOrAdminRole(user.role)) return { status: 403, user: null };
  return { status: 200, user };
}

/** Pages recheck the verified user and provisioned role; middleware refresh is not authorization. */
export async function authorizeStaffPortalPage(request: NextRequest): Promise<StaffPortalAccess> {
  try {
    const config = readStaffPortalConfig();
    const session = createSupabaseSession(request, config);
    return await resolveStaffPortalAccess(session.client.auth, createIdentityRoleRepository(getPostgresDatabase()));
  } catch { return { status: 503, user: null }; }
}
