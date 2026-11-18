import type { AuthRole, AuthSessionUser } from "../auth";

/** Implement with Supabase auth.getUser(), not getSession() or decoded cookies. */
export interface VerifiedSupabaseAuth {
  getUser(): Promise<{ data: { user: { id: string; email?: string; phone?: string } | null }; error: unknown }>;
}

export interface ProvisionedIdentity {
  userId: string;
  role: AuthRole;
  active: boolean;
  fullName: string;
  branchId: string | null;
}

/** Read from a server-owned role table. Never from user_metadata or request input. */
export interface IdentityRoleRepository {
  findActiveIdentity(userId: string): Promise<ProvisionedIdentity | null>;
}

const roles: readonly AuthRole[] = ["admin", "store_manager", "warehouse_staff", "clinic_doctor", "cs_agent", "customer"];

export interface IdentitySqlConnection {
  query(sql: string, values: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/** Trusted server DB connection only; no browser client or metadata fallback. */
export function createIdentityRoleRepository(connection: IdentitySqlConnection): IdentityRoleRepository {
  return {
    async findActiveIdentity(userId) {
      const result = await connection.query(`SELECT user_id, role, active, full_name, branch_id
        FROM nari_identity.provisioned_identities WHERE user_id = $1::uuid AND active = true`, [userId]);
      if (result.rows.length !== 1) return null;
      const row = result.rows[0];
      if (row.user_id !== userId || row.active !== true || typeof row.role !== "string" ||
        !roles.some(role => role === row.role) || typeof row.full_name !== "string" || !row.full_name.trim() ||
        (row.branch_id !== null && (typeof row.branch_id !== "string" || !row.branch_id.trim()))) return null;
      const role = roles.find(role => role === row.role);
      if (!role) return null;
      return { userId, role, active: true, fullName: row.full_name, branchId: typeof row.branch_id === "string" ? row.branch_id : null };
    },
  };
}

/** No business caller is enabled until per-resource permission/ownership is wired. */
export async function resolveSupabasePrincipal(
  auth: VerifiedSupabaseAuth,
  identities: IdentityRoleRepository,
): Promise<AuthSessionUser | null> {
  try {
    const result = await auth.getUser();
    const user = result.data.user;
    if (result.error || !user?.id) return null;
    const identity = await identities.findActiveIdentity(user.id);
    if (!identity || !identity.active || identity.userId !== user.id || !roles.includes(identity.role)) return null;
    if (!identity.fullName?.trim() || (identity.branchId !== null && !identity.branchId.trim())) return null;
    if (identity.role !== "admin" && identity.role !== "customer" && !identity.branchId) return null;
    return {
      id: user.id,
      email: user.email || "",
      phone: user.phone || "",
      fullName: identity.fullName,
      role: identity.role,
      roleLabel: identity.role,
      branchId: identity.branchId || undefined,
      loggedInAt: new Date().toISOString(),
    };
  } catch {
    // Network, provider or role database failure must never grant access.
    return null;
  }
}

/** Reject cross-origin cookie mutations before parsing bodies or touching data. */
export function hasTrustedMutationOrigin(request: Request, applicationOrigin: string): boolean {
  try {
    const configured = new URL(applicationOrigin);
    if (configured.origin !== applicationOrigin || configured.username || configured.password) return false;
    return request.headers.get("origin") === configured.origin;
  } catch {
    return false;
  }
}
