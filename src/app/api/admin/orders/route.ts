import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { authenticationRequired } from "@/lib/server/access-policy";
import {
  listErpOrders,
  createErpOrder,
  updateErpOrderStatus,
  getErpDashboardKpis,
  type ErpOrderStatus,
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
  const status = (url.searchParams.get("status") as ErpOrderStatus) || undefined;
  const branch = url.searchParams.get("branch") || undefined;
  const includeKpis = url.searchParams.get("includeKpis") === "true";

  const orders = listErpOrders({ search, status, branch });
  const kpis = includeKpis ? getErpDashboardKpis() : undefined;

  return NextResponse.json({
    success: true,
    orders,
    kpis,
    total: orders.length,
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
    const newOrder = createErpOrder(body);

    return NextResponse.json({
      success: true,
      message: "Tạo đơn hàng ERP thành công",
      order: newOrder,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tạo đơn hàng ERP" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = extractSessionTokenFromCookieHeader(cookieHeader);
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session || !isStaffOrAdminRole(session.role)) {
    return authenticationRequired();
  }

  try {
    const body = await request.json();
    const { orderId, status, assignedStaffCode } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập orderId và trạng thái mới" },
        { status: 400 }
      );
    }

    const updated = updateErpOrderStatus(orderId, status as ErpOrderStatus, assignedStaffCode || session.id);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đơn hàng: ${orderId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái đơn ${updated.orderCode} sang "${updated.statusLabel}"`,
      order: updated,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi cập nhật trạng thái đơn hàng" },
      { status: 500 }
    );
  }
}
