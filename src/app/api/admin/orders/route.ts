import { NextResponse, type NextRequest } from "next/server";
import { authenticationRequired } from "@/lib/server/access-policy";
import type { ErpOrderStatus } from "@/lib/erp-types";

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
    { getPostgresAdminDashboardKpis, listPostgresAdminOrders },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "orders:read",
  });
  if (access.response) return access.response;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const branchId = url.searchParams.get("branch") || url.searchParams.get("branchId") || undefined;
    const includeKpis = url.searchParams.get("includeKpis") === "true";
    const scopedBranchId = access.user.role === "admin" ? null : access.user.branchId || "__NONE__";

    const db = getPostgresDatabase();
    const [orders, kpis] = await Promise.all([
      listPostgresAdminOrders(db, { search, status, branchId, scopedBranchId }),
      includeKpis ? getPostgresAdminDashboardKpis(db, scopedBranchId) : Promise.resolve(undefined),
    ]);

    return sessionResponse(access.template, { ok: true, success: true, orders, kpis, total: orders.length });
  } catch {
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_ORDERS_UNAVAILABLE", error: "Không thể tải danh sách đơn hàng." },
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
    { createPostgresOrder, OrderInputError },
    { listPostgresAdminOrders },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/bounded-request-body"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-order-service"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "orders:write",
  });
  if (access.response) return access.response;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 64 * 1024));
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const requestedBranchId = typeof body.branchId === "string" ? body.branchId.trim() : "";
    const effectiveBranchId =
      access.user.role === "admin" ? requestedBranchId || undefined : access.user.branchId || "__NONE__";
    if (requestedBranchId && !access.canAccessBranch(requestedBranchId)) {
      return sessionResponse(
        access.template,
        { ok: false, success: false, code: "PERMISSION_DENIED", error: "Bạn không có quyền tạo đơn cho chi nhánh này." },
        403,
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return { quantity: 0 };
      const rec = item as Record<string, unknown>;
      return {
        sku: typeof rec.sku === "string" ? rec.sku : undefined,
        slug: typeof rec.slug === "string" ? rec.slug : undefined,
        quantity: typeof rec.quantity === "number" ? rec.quantity : Number(rec.quantity),
      };
    });

    const idempotencyKey =
      (typeof body.idempotencyKey === "string" && body.idempotencyKey.trim()) ||
      request.headers.get("idempotency-key")?.trim() ||
      `erp-${crypto.randomUUID()}`;

    const db = getPostgresDatabase();
    const created = await createPostgresOrder(db, {
      idempotencyKey,
      branchId: effectiveBranchId,
      recipientName: typeof body.recipientName === "string" ? body.recipientName : "",
      recipientPhone: typeof body.recipientPhone === "string" ? body.recipientPhone : "",
      shippingAddress: typeof body.shippingAddress === "string" ? body.shippingAddress : "",
      deliveryType: typeof body.deliveryType === "string" ? body.deliveryType : "NariNow 2H",
      paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod : "cod",
      notes: typeof body.notes === "string" ? body.notes : "",
      items,
    });

    const hydrated = await listPostgresAdminOrders(db, {
      search: created.orderCode,
      scopedBranchId: access.user.role === "admin" ? null : access.user.branchId || "__NONE__",
    });
    const order = hydrated.find((o) => o.id === created.order.id);

    return sessionResponse(
      access.template,
      { ok: true, success: true, message: "Tạo đơn hàng ERP thành công", orderCode: created.orderCode, order },
      created.replayed ? 200 : 201,
    );
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
    }
    if (error instanceof SyntaxError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "JSON không hợp lệ." }, 400);
    }
    if (error instanceof OrderInputError) {
      return sessionResponse(access.template, { ok: false, success: false, code: error.code, error: error.message }, error.status);
    }
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_ORDERS_UNAVAILABLE", error: "Không thể tạo đơn hàng." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest, hasPermission },
    { readBoundedRequestBody, RequestBodyLimitError },
    { getPostgresDatabase },
    { sessionResponse },
    { ErpServiceError, advancePostgresAdminOrderStatus },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/bounded-request-body"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "orders:read",
  });
  if (access.response) return access.response;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 32 * 1024));
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const status = typeof body.status === "string" ? (body.status.trim() as ErpOrderStatus) : ("" as ErpOrderStatus);
    const expectedVersion =
      typeof body.expectedVersion === "number" && Number.isInteger(body.expectedVersion)
        ? body.expectedVersion
        : undefined;
    const note = typeof body.note === "string" ? body.note : undefined;

    if (!orderId || !status) {
      return sessionResponse(
        access.template,
        { ok: false, success: false, code: "ORDER_PATCH_REQUIRED", error: "Vui lòng nhập orderId và trạng thái mới." },
        400,
      );
    }

    const canMutate =
      hasPermission(access.user, "orders:write") ||
      ((status === "packing" || status === "shipping") && hasPermission(access.user, "orders:pack"));
    if (!canMutate) {
      return sessionResponse(
        access.template,
        { ok: false, success: false, code: "PERMISSION_DENIED", error: "Bạn không có quyền chuyển trạng thái đơn hàng này." },
        403,
      );
    }

    const scopedBranchId = access.user.role === "admin" ? null : access.user.branchId || "__NONE__";
    const actorId = access.user.email || access.user.id;
    const updated = await advancePostgresAdminOrderStatus(getPostgresDatabase(), {
      orderId,
      toStatus: status,
      expectedVersion,
      actorId,
      scopedBranchId,
      note,
    });

    return sessionResponse(access.template, {
      ok: true,
      success: true,
      message: `Đã cập nhật trạng thái đơn ${updated.orderCode} sang "${updated.statusLabel}"`,
      order: updated,
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
      { ok: false, success: false, code: "ERP_ORDERS_UNAVAILABLE", error: "Không thể cập nhật trạng thái đơn hàng." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
