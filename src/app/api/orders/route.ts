import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  createOrder,
  listOrders,
  getOrderByIdOrCode,
} from "@/lib/db/repository";
import {
  extractSessionTokenFromCookieHeader,
  verifySignedSessionToken,
  isStaffOrAdminRole,
} from "@/lib/auth";
import { getProductBySkuOrSlug, listAllBranches } from "@/lib/sqlite-db";
import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

// The legacy order flow does not yet enforce ownership or server-side pricing.
// Keep it closed until the replacement service is ready and tested.
function isOrderServiceReady(): boolean {
  return false;
}

export async function GET(request: NextRequest) {
  if (!isOrderServiceReady()) return authenticationRequired();
  try {
    const url = new URL(request.url);
    const cookieHeader = request.headers.get("cookie");
    const token = extractSessionTokenFromCookieHeader(cookieHeader);
    const session = token ? await verifySignedSessionToken(token) : null;

    const lookupCode = url.searchParams.get("code") || url.searchParams.get("orderCode");
    const lookupPhone = url.searchParams.get("phone");

    // Public Guest Order Tracking by Order Code & Phone
    if (lookupCode) {
      const order = await getOrderByIdOrCode(lookupCode);
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy đơn hàng với mã đã cung cấp" },
          { status: 404 }
        );
      }

      // If phone is provided, verify matching recipient phone
      if (lookupPhone && lookupPhone.trim() && order.customerPhone !== lookupPhone.trim()) {
        return NextResponse.json(
          { success: false, error: "Số điện thoại không trùng khớp với đơn hàng" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, order });
    }

    // Authenticated users
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập hoặc cung cấp mã đơn hàng để tra cứu" },
        { status: 401 }
      );
    }

    if (isStaffOrAdminRole(session.role)) {
      // Staff / Admin: Can view all orders or filter by status/search
      const search = url.searchParams.get("search") || undefined;
      const status = url.searchParams.get("status") || undefined;
      const result = await listOrders({ search, status });
      return NextResponse.json({ success: true, ...result });
    } else {
      // Customer: Can only view their own orders
      const result = await listOrders({ userId: session.id });
      return NextResponse.json({ success: true, ...result });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi truy vấn đơn hàng" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isOrderServiceReady()) return serviceUnavailable();
  try {
    const body = await request.json().catch(() => ({}));
    const cookieHeader = request.headers.get("cookie");
    const token = extractSessionTokenFromCookieHeader(cookieHeader);
    const session = token ? await verifySignedSessionToken(token) : null;

    const recipientName = (body.recipientName || body.customerName || body.name || "").trim();
    const recipientPhone = (body.recipientPhone || body.customerPhone || body.phone || "").trim();
    const shippingAddress = (body.shippingAddress || body.address || "").trim();
    const deliveryType = body.deliveryType === "Tiêu chuẩn" ? "Tiêu chuẩn" : "NariNow 2H";
    const paymentMethod = body.paymentMethod || "Thanh toán khi nhận hàng (COD)";
    const rawItems: Array<{ sku?: string; slug?: string; quantity?: number; price?: number; name?: string }> = body.items || [];

    if (!recipientName || !recipientPhone || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng" },
        { status: 400 }
      );
    }

    if (!rawItems.length) {
      return NextResponse.json(
        { success: false, error: "Giỏ hàng không có sản phẩm nào để tạo đơn" },
        { status: 400 }
      );
    }

    // Resolve SKUs and products
    const resolvedItems: Array<{ sku: string; quantity: number; name?: string; price?: number; slug?: string; image?: string }> = [];

    for (const item of rawItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      let sku = item.sku;
      let name = item.name;
      let price = item.price;
      let slug = item.slug;
      let image: string | undefined;

      if (!sku && item.slug) {
        const prod = getProductBySkuOrSlug(item.slug);
        if (prod) {
          sku = prod.sku;
          name = prod.name;
          price = prod.price;
          slug = prod.slug;
          image = prod.thumbnailUrl || undefined;
        }
      }

      if (!sku) {
        // Fallback SKU from slug or random
        sku = item.slug ? `SKU-${item.slug.slice(0, 8)}` : "10023401";
      }

      resolvedItems.push({
        sku,
        quantity: qty,
        name,
        price,
        slug,
        image,
      });
    }

    // Check branch: find branch matching delivery type or chosen branch
    const branches = listAllBranches(true);
    let targetBranch = branches.find((b) => b.id === body.branchId);

    if (!targetBranch) {
      if (deliveryType === "NariNow 2H") {
        targetBranch = branches.find((b) => b.supportsNowFree2H) || branches[0];
      } else {
        targetBranch = branches[0];
      }
    }

    const order = await createOrder({
      userId: session ? session.id : null,
      customerName: recipientName,
      customerPhone: recipientPhone,
      shippingAddress,
      branchId: targetBranch ? targetBranch.id : "CN1",
      deliveryType,
      paymentMethod,
      items: resolvedItems,
      notes: body.note || body.notes,
    });

    return NextResponse.json({
      success: true,
      code: order.orderCode,
      orderCode: order.orderCode,
      order,
      vietQrUrl: order.vietQrUrl,
      vietQrPayload: order.vietQrPayload,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tạo đơn hàng" },
      { status: 500 }
    );
  }
}
