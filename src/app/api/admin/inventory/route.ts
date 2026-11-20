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
    { listPostgresAdminInventory, listPostgresAdminInventoryMovements },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "inventory:read",
  });
  if (access.response) return access.response;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const branchId = url.searchParams.get("branchId") || undefined;
    const lowStockOnly = url.searchParams.get("lowStockOnly") === "true";
    const includeLogs = url.searchParams.get("includeLogs") === "true";
    const scopedBranchId = access.user.role === "admin" ? null : access.user.branchId || "__NONE__";

    const db = getPostgresDatabase();
    const [{ inventory, branches }, auditLogs] = await Promise.all([
      listPostgresAdminInventory(db, { search, branchId, lowStockOnly, scopedBranchId }),
      includeLogs ? listPostgresAdminInventoryMovements(db, 50, scopedBranchId) : Promise.resolve([]),
    ]);

    return sessionResponse(access.template, {
      ok: true,
      success: true,
      inventory,
      branches,
      auditLogs,
      total: inventory.length,
    });
  } catch {
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_INVENTORY_UNAVAILABLE", error: "Không thể tải dữ liệu tồn kho." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest },
    { readBoundedRequestBody, RequestBodyLimitError },
    { getPostgresDatabase },
    { sessionResponse },
    { ErpServiceError, adjustPostgresAdminInventoryStock },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/bounded-request-body"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "inventory:write",
  });
  if (access.response) return access.response;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 32 * 1024));
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const sku = typeof body.sku === "string" ? body.sku.trim() : "";
    const delta = typeof body.delta === "number" ? body.delta : Number.NaN;
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "Điều chỉnh tồn kho từ Quản trị ERP";
    const branchId =
      typeof body.branchId === "string" && body.branchId.trim()
        ? body.branchId.trim()
        : access.user.branchId || "";

    if (!sku || !Number.isInteger(delta) || !branchId) {
      return sessionResponse(
        access.template,
        { ok: false, success: false, code: "INVENTORY_INPUT_REQUIRED", error: "Vui lòng nhập SKU, chi nhánh và số lượng delta nguyên." },
        400,
      );
    }

    const scopedBranchId = access.user.role === "admin" ? null : access.user.branchId || "__NONE__";
    const actorId = access.user.email || access.user.id;
    const idempotencyKey =
      (typeof body.idempotencyKey === "string" && body.idempotencyKey.trim()) ||
      request.headers.get("idempotency-key")?.trim() ||
      undefined;

    const result = await adjustPostgresAdminInventoryStock(getPostgresDatabase(), {
      sku,
      branchId,
      delta,
      reason,
      actorId,
      idempotencyKey,
      scopedBranchId,
    });

    return sessionResponse(access.template, {
      ok: true,
      success: true,
      message: `Cập nhật tồn kho SKU ${sku} thành công`,
      updatedItem: result.updatedItem,
      auditLog: result.auditLog,
    });
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
    }
    if (error instanceof SyntaxError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "JSON không hợp lệ." }, 400);
    }
    if (error instanceof ErpServiceError) {
      return sessionResponse(access.template, { ok: false, success: false, code: error.code, error: error.message }, error.status);
    }
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_INVENTORY_UNAVAILABLE", error: "Không thể điều chỉnh tồn kho." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
