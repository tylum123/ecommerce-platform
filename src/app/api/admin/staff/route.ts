import { NextResponse, type NextRequest } from "next/server";
import { authenticationRequired } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest },
    { getPostgresDatabase },
    { sessionResponse },
    { listPostgresAdminStaff },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "staff:read",
  });
  if (access.response) return access.response;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const role = url.searchParams.get("role") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const branchId = url.searchParams.get("branchId") || undefined;
    const scopedBranchId = access.user.role === "admin" ? null : access.user.branchId || "__NONE__";

    const staff = await listPostgresAdminStaff(getPostgresDatabase(), {
      search,
      role,
      status,
      branchId,
      scopedBranchId,
    });

    return sessionResponse(access.template, { ok: true, success: true, staff, total: staff.length });
  } catch {
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_STAFF_UNAVAILABLE", error: "Không thể tải danh sách nhân sự." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

async function handleStaffMutationDenied(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [{ authorizeBusinessRequest }, { sessionResponse }] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/supabase-session"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "staff:manage",
  });
  if (access.response) return access.response;

  return sessionResponse(
    access.template,
    {
      ok: false,
      success: false,
      code: "STAFF_PROVISIONING_OUT_OF_BAND",
      error: "Quyền nhân sự (nari_identity.provisioned_identities) chỉ được cấp hoặc thu hồi qua Supabase owner SQL ngoài runtime.",
    },
    501,
  );
}

export const POST = handleStaffMutationDenied;
export const PATCH = handleStaffMutationDenied;
