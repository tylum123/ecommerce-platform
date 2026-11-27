import { NextResponse, type NextRequest } from "next/server";
import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

const MAX_ORDER_BODY_BYTES = 128 * 1024;

function mapOrderErrorMessage(code: string): string {
  switch (code) {
    case "ORDER_IDEMPOTENCY_KEY_INVALID":
      return "Khóa xác nhận đơn hàng không hợp lệ.";
    case "ORDER_IDEMPOTENCY_IN_PROGRESS":
      return "Đơn hàng đang được xử lý, vui lòng đợi trong giây lát.";
    case "ORDER_IDEMPOTENCY_CONFLICT":
      return "Khóa xác nhận đơn hàng đã được sử dụng cho thao tác khác.";
    case "ORDER_RECIPIENT_NAME_REQUIRED":
      return "Vui lòng nhập họ và tên người nhận.";
    case "ORDER_RECIPIENT_PHONE_INVALID":
      return "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0.";
    case "ORDER_SHIPPING_ADDRESS_REQUIRED":
      return "Vui lòng nhập địa chỉ nhận hàng.";
    case "ORDER_DELIVERY_TYPE_INVALID":
      return "Phương thức vận chuyển không hợp lệ.";
    case "ORDER_PAYMENT_METHOD_INVALID":
      return "Phương thức thanh toán không hợp lệ.";
    case "ORDER_ITEMS_INVALID":
    case "ORDER_ITEM_IDENTIFIER_REQUIRED":
    case "ORDER_ITEM_QUANTITY_INVALID":
      return "Danh sách sản phẩm hoặc số lượng đặt mua không hợp lệ.";
    case "ORDER_PRODUCT_NOT_FOUND":
      return "Một số sản phẩm trong giỏ hàng hiện không tồn tại hoặc đã ngừng kinh doanh.";
    case "ORDER_BRANCH_NOT_FOUND":
      return "Chi nhánh xử lý đơn hàng không khả dụng.";
    case "ORDER_INSUFFICIENT_STOCK":
      return "Sản phẩm trong giỏ hàng đã hết hoặc không đủ tồn kho tại chi nhánh.";
    case "ORDER_CODE_REQUIRED":
      return "Vui lòng nhập mã đơn hàng.";
    case "ORDER_VERSION_CONFLICT":
      return "Trạng thái đơn hàng vừa được cập nhật, vui lòng tải lại.";
    case "ORDER_CANCEL_IDENTITY_REQUIRED":
      return "Vui lòng đăng nhập hoặc nhập số điện thoại đặt hàng để hủy đơn.";
    case "ORDER_NOT_FOUND":
      return "Không tìm thấy đơn hàng khớp với thông tin đã cung cấp.";
    case "ORDER_NOT_CANCELLABLE":
      return "Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận.";
    case "ORDER_ACTION_INVALID":
      return "Hành động đơn hàng không hợp lệ.";
    default:
      return "Yêu cầu đơn hàng không hợp lệ.";
  }
}

export async function GET(request: NextRequest) {
  if (process.env.NARI_ORDERS_ENABLED !== "true") {
    return authenticationRequired();
  }

  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code")?.trim() || "";
  const phone = searchParams.get("phone")?.trim() || "";

  if (!code || !phone) {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_LOOKUP_PARAMS_REQUIRED",
        error: "Vui lòng nhập đầy đủ mã đơn hàng và số điện thoại.",
      },
      { status: 400 },
    );
  }

  try {
    const [{ getPostgresDatabase }, { lookupPostgresOrder, OrderInputError }] = await Promise.all([
      import("@/lib/server/postgres-database"),
      import("@/lib/server/postgres-order-service"),
    ]);

    try {
      const order = await lookupPostgresOrder(getPostgresDatabase(), code, phone);
      if (!order) {
        return NextResponse.json(
          {
            ok: false,
            code: "ORDER_NOT_FOUND",
            error: "Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại đã nhập.",
          },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true, success: true, order }, { status: 200 });
    } catch (error) {
      if (error instanceof OrderInputError) {
        return NextResponse.json(
          { ok: false, code: error.code, error: mapOrderErrorMessage(error.code) },
          { status: error.status },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_SERVICE_UNAVAILABLE",
          error: "Dịch vụ tra cứu đơn hàng tạm thời không khả dụng.",
        },
        { status: 503 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_SERVICE_UNAVAILABLE",
        error: "Dịch vụ tra cứu đơn hàng tạm thời không khả dụng.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NARI_ORDERS_ENABLED !== "true") {
    return serviceUnavailable();
  }

  try {
    const [
      { hasTrustedMutationOrigin },
      { readBoundedRequestBody, RequestBodyLimitError },
      { getPostgresDatabase },
      { createPostgresOrder, buildVietQrPaymentDetails, OrderInputError },
    ] = await Promise.all([
      import("@/lib/server/supabase-principal"),
      import("@/lib/server/bounded-request-body"),
      import("@/lib/server/postgres-database"),
      import("@/lib/server/postgres-order-service"),
    ]);

    const appOrigin = process.env.APP_ORIGIN?.trim() || "";
    if (!appOrigin || !hasTrustedMutationOrigin(request, appOrigin)) {
      return NextResponse.json(
        { ok: false, code: "FORBIDDEN_ORIGIN", error: "Yêu cầu không hợp lệ (Origin không được phép)." },
        { status: 403 },
      );
    }

    let rawBytes: Uint8Array<ArrayBuffer>;
    try {
      rawBytes = await readBoundedRequestBody(request, MAX_ORDER_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return NextResponse.json(
          { ok: false, code: "REQUEST_BODY_TOO_LARGE", error: "Dữ liệu đơn hàng vượt quá kích thước cho phép." },
          { status: 413 },
        );
      }
      throw error;
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(new TextDecoder().decode(rawBytes));
    } catch {
      return NextResponse.json(
        { ok: false, code: "INVALID_JSON", error: "Dữ liệu đơn hàng không đúng định dạng JSON." },
        { status: 400 },
      );
    }

    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_JSON", error: "Dữ liệu đơn hàng phải là một đối tượng JSON." },
        { status: 400 },
      );
    }

    const body = parsedBody as Record<string, unknown>;
    const headerKey = request.headers.get("idempotency-key")?.trim() || "";
    const bodyKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    if (headerKey && bodyKey && headerKey !== bodyKey) {
      return NextResponse.json(
        { ok: false, code: "ORDER_IDEMPOTENCY_KEY_MISMATCH", error: "Khóa chống trùng lặp đơn hàng không khớp." },
        { status: 400 },
      );
    }
    const idempotencyKey = headerKey || bodyKey;
    if (!idempotencyKey) {
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_IDEMPOTENCY_KEY_REQUIRED",
          error: "Thiếu khóa chống trùng lặp đơn hàng (Idempotency-Key).",
        },
        { status: 400 },
      );
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = rawItems.map((raw) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        return { quantity: 0 };
      }
      const item = raw as Record<string, unknown>;
      return {
        sku: typeof item.sku === "string" ? item.sku : undefined,
        slug: typeof item.slug === "string" ? item.slug : undefined,
        quantity: typeof item.quantity === "number" ? item.quantity : Number(item.quantity),
      };
    });

    let verifiedUserId: string | null = null;
    if (process.env.NARI_AUTH_ENABLED === "true") {
      try {
        const { resolveOptionalSupabaseUserId } = await import("@/lib/server/supabase-session");
        verifiedUserId = await resolveOptionalSupabaseUserId(request);
      } catch {
        verifiedUserId = null;
      }
    }

    try {
      const result = await createPostgresOrder(getPostgresDatabase(), {
        idempotencyKey,
        userId: verifiedUserId,
        branchId: typeof body.branchId === "string" ? body.branchId : undefined,
        recipientName: typeof body.recipientName === "string" ? body.recipientName : "",
        recipientPhone: typeof body.recipientPhone === "string" ? body.recipientPhone : "",
        shippingAddress: typeof body.shippingAddress === "string" ? body.shippingAddress : "",
        deliveryType: typeof body.deliveryType === "string" ? body.deliveryType : undefined,
        paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod : "cod",
        notes: typeof body.notes === "string" ? body.notes : typeof body.note === "string" ? body.note : "",
        items,
      });

      const vietQr = result.order.paymentMethod.toLowerCase().includes("vietqr")
        ? buildVietQrPaymentDetails({
            amount: result.order.totalAmount,
            orderCode: result.orderCode,
          })
        : null;

      return NextResponse.json(
        {
          ok: true,
          success: true,
          code: result.orderCode,
          orderCode: result.orderCode,
          order: result.order,
          items: result.items,
          replayed: result.replayed,
          vietQr,
        },
        { status: result.replayed ? 200 : 201 },
      );
    } catch (error) {
      if (error instanceof OrderInputError) {
        return NextResponse.json(
          { ok: false, code: error.code, error: mapOrderErrorMessage(error.code) },
          { status: error.status },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_SERVICE_UNAVAILABLE",
          error: "Chưa thể tạo đơn hàng. Dịch vụ đặt hàng tạm thời không khả dụng.",
        },
        { status: 503 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_SERVICE_UNAVAILABLE",
        error: "Chưa thể tạo đơn hàng. Dịch vụ đặt hàng tạm thời không khả dụng.",
      },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (process.env.NARI_ORDERS_ENABLED !== "true") {
    return serviceUnavailable();
  }

  try {
    const [
      { hasTrustedMutationOrigin },
      { readBoundedRequestBody, RequestBodyLimitError },
      { getPostgresDatabase },
      { cancelPostgresOrder, OrderInputError },
    ] = await Promise.all([
      import("@/lib/server/supabase-principal"),
      import("@/lib/server/bounded-request-body"),
      import("@/lib/server/postgres-database"),
      import("@/lib/server/postgres-order-service"),
    ]);

    const appOrigin = process.env.APP_ORIGIN?.trim() || "";
    if (!appOrigin || !hasTrustedMutationOrigin(request, appOrigin)) {
      return NextResponse.json(
        { ok: false, code: "FORBIDDEN_ORIGIN", error: "Yêu cầu không hợp lệ (Origin không được phép)." },
        { status: 403 },
      );
    }

    let rawBytes: Uint8Array<ArrayBuffer>;
    try {
      rawBytes = await readBoundedRequestBody(request, MAX_ORDER_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return NextResponse.json(
          { ok: false, code: "REQUEST_BODY_TOO_LARGE", error: "Dữ liệu yêu cầu vượt quá kích thước cho phép." },
          { status: 413 },
        );
      }
      throw error;
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(new TextDecoder().decode(rawBytes));
    } catch {
      return NextResponse.json(
        { ok: false, code: "INVALID_JSON", error: "Dữ liệu yêu cầu không đúng định dạng JSON." },
        { status: 400 },
      );
    }

    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json(
        { ok: false, code: "INVALID_JSON", error: "Dữ liệu yêu cầu phải là một đối tượng JSON." },
        { status: 400 },
      );
    }

    const body = parsedBody as Record<string, unknown>;
    if (body.action !== "cancel") {
      return NextResponse.json(
        { ok: false, code: "ORDER_ACTION_INVALID", error: mapOrderErrorMessage("ORDER_ACTION_INVALID") },
        { status: 400 },
      );
    }

    const orderCode = typeof body.orderCode === "string" ? body.orderCode.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : undefined;

    let verifiedUserId: string | null = null;
    if (process.env.NARI_AUTH_ENABLED === "true") {
      try {
        const { resolveOptionalSupabaseUserId } = await import("@/lib/server/supabase-session");
        verifiedUserId = await resolveOptionalSupabaseUserId(request);
      } catch {
        verifiedUserId = null;
      }
    }

    try {
      const order = await cancelPostgresOrder(getPostgresDatabase(), {
        orderCode,
        userId: verifiedUserId,
        phone: phone || null,
        reason,
      });
      return NextResponse.json({ ok: true, success: true, order }, { status: 200 });
    } catch (error) {
      if (error instanceof OrderInputError) {
        return NextResponse.json(
          { ok: false, code: error.code, error: mapOrderErrorMessage(error.code) },
          { status: error.status },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          code: "ORDER_SERVICE_UNAVAILABLE",
          error: "Chưa thể hủy đơn hàng. Dịch vụ tạm thời không khả dụng.",
        },
        { status: 503 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        ok: false,
        code: "ORDER_SERVICE_UNAVAILABLE",
        error: "Chưa thể hủy đơn hàng. Dịch vụ tạm thời không khả dụng.",
      },
      { status: 503 },
    );
  }
}
