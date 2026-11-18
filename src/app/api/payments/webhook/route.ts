import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSqliteDb } from "@/lib/sqlite-db";
import { serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";

// Provider signatures, payment amount and replay protection are not yet verified.
function isPaymentWebhookReady(): boolean {
  return false;
}

export async function POST(request: NextRequest) {
  if (!isPaymentWebhookReady()) return serviceUnavailable();
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") || "vietqr";
    const body = await request.json().catch(() => ({}));

    // Extract order code and payment amount
    // VietQR / Bank Transfer webhook payload format:
    // { orderCode: "HSK-...", amount: 435000, reference: "FT...", transactionId: "..." }
    // VNPAY format: { vnp_TxnRef: "HSK-...", vnp_Amount: 43500000, vnp_ResponseCode: "00" }
    // MoMo format: { orderId: "HSK-...", amount: 435000, resultCode: 0 }

    let orderCode = "";
    let amount = 0;
    let isSuccess = false;
    let transactionId = "";

    if (provider === "vnpay") {
      orderCode = body.vnp_TxnRef || "";
      amount = Number(body.vnp_Amount) ? Number(body.vnp_Amount) / 100 : 0;
      isSuccess = body.vnp_ResponseCode === "00";
      transactionId = body.vnp_TransactionNo || body.vnp_BankTranNo || "";
    } else if (provider === "momo") {
      orderCode = body.orderId || "";
      amount = Number(body.amount) || 0;
      isSuccess = Number(body.resultCode) === 0;
      transactionId = String(body.transId || "");
    } else {
      // Default: VietQR / Bank Transfer webhook
      orderCode = body.orderCode || body.orderId || body.code || "";
      amount = Number(body.amount) || 0;
      isSuccess = true;
      transactionId = body.transactionId || body.reference || `TXN-${Date.now()}`;
    }

    if (!orderCode) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã đơn hàng trong payload webhook" },
        { status: 400 }
      );
    }

    const db = getSqliteDb();
    const order = db.prepare("SELECT * FROM orders WHERE order_code = ? OR id = ?").get(orderCode, orderCode) as {
      id: string;
      order_code: string;
      total: number;
      payment_status: string;
      status: string;
    } | undefined;

    if (!order) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy đơn hàng: ${orderCode}` },
        { status: 404 }
      );
    }

    // Idempotency: If already paid, return 200 without duplicate execution
    if (order.payment_status === "paid") {
      return NextResponse.json({
        success: true,
        message: `Đơn hàng ${order.order_code} đã được ghi nhận thanh toán trước đó (idempotent)`,
        orderCode: order.order_code,
      });
    }

    if (!isSuccess) {
      return NextResponse.json({
        success: false,
        message: `Giao dịch ${transactionId} không thành công từ nhà cung cấp ${provider}`,
        orderCode: order.order_code,
      });
    }

    // Update order payment status to 'paid' and workflow status to 'confirmed'
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE orders
      SET payment_status = 'paid',
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          notes = COALESCE(notes || ' | ', '') || 'Thanh toán thành công qua ' || ? || ' (Mã GD: ' || ? || ')',
          updated_at = ?
      WHERE id = ?
    `).run(provider.toUpperCase(), transactionId, now, order.id);

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận thanh toán thành công cho đơn hàng ${order.order_code}`,
      orderCode: order.order_code,
      amount,
      provider,
      transactionId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi xử lý webhook thanh toán" },
      { status: 500 }
    );
  }
}
