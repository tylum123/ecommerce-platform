import type { AuthRole, AuthSessionUser } from "../auth";

/** Fail closed until a maintained auth provider and persistent services are configured.
 * Client roles, cookies and bearer strings are deliberately not accepted as identity.
 */
export function authenticationRequired(): Response {
  return Response.json(
    {
      ok: false,
      success: false,
      code: "AUTHENTICATION_REQUIRED",
      error: "Chức năng tài khoản và quản trị tạm chưa sẵn sàng. Vui lòng thử lại sau.",
    },
    { status: 401, headers: { "Cache-Control": "private, no-store" } },
  );
}

export function serviceUnavailable(): Response {
  return Response.json(
    {
      ok: false,
      success: false,
      code: "SERVICE_UNAVAILABLE",
      error: "Chức năng này tạm chưa sẵn sàng. Yêu cầu của bạn chưa được gửi hoặc lưu. Vui lòng thử lại sau.",
    },
    { status: 503, headers: { "Cache-Control": "private, no-store" } },
  );
}

export const PRIVATE_LOGIN_PATH = "/dang-nhap?reason=unavailable";

// Grants come from this policy, never a browser-supplied permissions array.
const ROLE_GRANTS: Record<AuthRole, readonly string[]> = {
  admin: [], // Highest role; covers future modules without manually adding grants.
  store_manager: ["orders:read", "orders:write", "inventory:read", "staff:read", "reports:branch"],
  warehouse_staff: ["inventory:read", "inventory:write", "orders:pack", "shipping:dispatch"],
  clinic_doctor: ["clinic:appointments", "clinic:treatments", "clinic:prescriptions"],
  cs_agent: ["orders:read", "orders:support", "tickets:manage"],
  customer: ["portal:profile", "portal:orders", "portal:bookings", "portal:address"],
};

/** Only call with a principal obtained from a verified server session. */
export function hasPermission(user: Pick<AuthSessionUser, "role"> | null, permission: string): boolean {
  if (!user || !permission) return false;
  if (user.role === "admin") return true;
  return ROLE_GRANTS[user.role]?.includes(permission) ?? false;
}

/** Admin can cross branches; other staff must match an explicit resource branch. */
export function canAccessBranch(
  user: Pick<AuthSessionUser, "role" | "branchId"> | null,
  branchId: string | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.role !== "customer" && Boolean(branchId && user.branchId === branchId);
}

export function permissionDenied(): Response {
  return Response.json({ success: false, code: "PERMISSION_DENIED", error: "Bạn không có quyền thực hiện thao tác này." }, {
    status: 403, headers: { "Cache-Control": "private, no-store" },
  });
}

/** Stable boundary for API handlers. Wire a maintained provider here before
 * enabling access; do not accept localStorage, demo JWTs or request role claims.
 * Mutation handlers must also verify CSRF and resource/branch ownership.
 */
export async function authorizeRequest(
  request: Request,
  permission: string,
): Promise<{ user: AuthSessionUser | null; response: Response | null }> {
  void request;
  void permission;
  return { user: null, response: authenticationRequired() };
}
