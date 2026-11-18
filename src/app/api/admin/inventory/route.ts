import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { authenticationRequired } from "@/lib/server/access-policy";
import {
  listInventory,
  adjustInventoryStock,
  listInventoryAuditLogs,
} from "@/lib/server/erp-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || undefined;
  const branchId = url.searchParams.get("branchId") || undefined;
  const lowStockOnly = url.searchParams.get("lowStockOnly") === "true";
  const includeLogs = url.searchParams.get("includeLogs") === "true";

  const inventory = listInventory({ search, branchId, lowStockOnly });
  const auditLogs = includeLogs ? listInventoryAuditLogs(50) : [];

  return NextResponse.json({
    success: true,
    inventory,
    auditLogs,
    total: inventory.length,
  });
}

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  try {
    const body = await request.json();
    const { sku, delta, reason, branchId } = body;

    if (!sku || typeof delta !== "number") {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập SKU và số lượng delta" },
        { status: 400 }
      );
    }

    // Update in-memory ERP store
    const result = adjustInventoryStock({
      sku,
      delta,
      reason: reason || "Điều chỉnh tồn kho từ Quản trị ERP",
      staffCode: session.id,
      branchId: branchId || "CN1",
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy sản phẩm với SKU: ${sku}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Cập nhật tồn kho SKU ${sku} thành công`,
      updatedItem: result.updatedItem,
      auditLog: result.auditLog,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi xử lý kho" },
      { status: 500 }
    );
  }
}
