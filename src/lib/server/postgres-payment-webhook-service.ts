import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";

export type PaymentWebhookErrorStatus = 400 | 401 | 404 | 409;

/** Domain or signature error mapped deterministically to HTTP status codes. */
export class PaymentWebhookError extends Error {
  readonly status: PaymentWebhookErrorStatus;
  readonly code: string;

  constructor(code: string, status: PaymentWebhookErrorStatus, message?: string) {
    super(message || code);
    this.name = "PaymentWebhookError";
    this.code = code;
    this.status = status;
  }
}

export interface PaymentWebhookPayload {
  eventId: string;
  orderCode: string;
  amount: number;
  status: "paid" | "refunded";
  provider: string;
  transactionRef: string;
}

export interface PaymentWebhookResult {
  eventId: string;
  orderCode: string;
  orderId: string;
  status: string;
  paymentStatus: string;
  version: number;
  idempotentReplay: boolean;
}

const MAX_SAFE_MONEY = 9007199254740991;
const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300;
const HEX_SHA256_REGEX = /^[0-9a-f]{64}$/i;

/** Verify HMAC-SHA256 signature and timestamp replay window over the raw webhook payload. */
export function verifyPaymentWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
  secret: string;
  nowSeconds?: number;
  toleranceSeconds?: number;
}): void {
  if (!params.secret) {
    throw new PaymentWebhookError("WEBHOOK_SECRET_MISSING", 401, "Chưa cấu hình khóa xác thực webhook.");
  }

  const rawTs = typeof params.timestampHeader === "string" ? params.timestampHeader.trim() : "";
  if (!/^\d{1,12}$/.test(rawTs)) {
    throw new PaymentWebhookError("WEBHOOK_TIMESTAMP_INVALID", 401, "Timestamp webhook không hợp lệ.");
  }
  const timestamp = Number(rawTs);
  const nowSeconds = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  const toleranceSeconds = params.toleranceSeconds ?? DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > toleranceSeconds) {
    throw new PaymentWebhookError("WEBHOOK_TIMESTAMP_INVALID", 401, "Webhook đã quá hạn thời gian cho phép.");
  }

  const rawSig = typeof params.signatureHeader === "string" ? params.signatureHeader.trim() : "";
  const normalizedHex = rawSig.replace(/^sha256=/i, "");
  if (!HEX_SHA256_REGEX.test(normalizedHex)) {
    throw new PaymentWebhookError("WEBHOOK_SIGNATURE_INVALID", 401, "Chữ ký webhook không hợp lệ.");
  }

  const expectedHex = createHmac("sha256", params.secret)
    .update(`${timestamp}.${params.rawBody}`, "utf8")
    .digest("hex");

  const expectedBuf = Buffer.from(expectedHex, "hex");
  const providedBuf = Buffer.from(normalizedHex.toLowerCase(), "hex");
  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    throw new PaymentWebhookError("WEBHOOK_SIGNATURE_INVALID", 401, "Chữ ký webhook không hợp lệ.");
  }
}

/** Parse and strictly validate a payment webhook JSON payload. */
export function parsePaymentWebhookPayload(rawBody: string): PaymentWebhookPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new PaymentWebhookError("WEBHOOK_PAYLOAD_INVALID", 400, "Dữ liệu webhook không đúng định dạng JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new PaymentWebhookError("WEBHOOK_PAYLOAD_INVALID", 400, "Dữ liệu webhook phải là một đối tượng JSON.");
  }

  const body = parsed as Record<string, unknown>;
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : "";
  if (eventId.length < 8 || eventId.length > 120 || /[\r\n\0]/.test(eventId)) {
    throw new PaymentWebhookError("WEBHOOK_EVENT_ID_INVALID", 400, "Mã sự kiện webhook (eventId) không hợp lệ.");
  }

  const orderCode = typeof body.orderCode === "string" ? body.orderCode.trim() : "";
  if (!orderCode || orderCode.length > 80 || /[\r\n\0]/.test(orderCode)) {
    throw new PaymentWebhookError("WEBHOOK_ORDER_CODE_REQUIRED", 400, "Thiếu mã đơn hàng hợp lệ.");
  }

  if (
    typeof body.amount !== "number" ||
    !Number.isSafeInteger(body.amount) ||
    body.amount < 1 ||
    body.amount > MAX_SAFE_MONEY
  ) {
    throw new PaymentWebhookError("WEBHOOK_AMOUNT_INVALID", 400, "Số tiền thanh toán không hợp lệ.");
  }

  if (body.status !== "paid" && body.status !== "refunded") {
    throw new PaymentWebhookError("WEBHOOK_STATUS_INVALID", 400, "Trạng thái thanh toán webhook không hợp lệ.");
  }

  let provider = "vietqr";
  if (body.provider !== undefined && body.provider !== null) {
    if (typeof body.provider !== "string" || /[\r\n\0]/.test(body.provider)) {
      throw new PaymentWebhookError("WEBHOOK_PROVIDER_INVALID", 400, "Tên cổng thanh toán không hợp lệ.");
    }
    const trimmed = body.provider.trim();
    if (trimmed.length > 40) {
      throw new PaymentWebhookError("WEBHOOK_PROVIDER_INVALID", 400, "Tên cổng thanh toán quá dài.");
    }
    if (trimmed) provider = trimmed;
  }

  let transactionRef = "";
  if (body.transactionRef !== undefined && body.transactionRef !== null) {
    if (typeof body.transactionRef !== "string" || /[\r\n\0]/.test(body.transactionRef)) {
      throw new PaymentWebhookError("WEBHOOK_TX_REF_INVALID", 400, "Mã tham chiếu giao dịch không hợp lệ.");
    }
    const trimmed = body.transactionRef.trim();
    if (trimmed.length > 120) {
      throw new PaymentWebhookError("WEBHOOK_TX_REF_INVALID", 400, "Mã tham chiếu giao dịch quá dài.");
    }
    transactionRef = trimmed;
  }

  return {
    eventId,
    orderCode,
    amount: body.amount,
    status: body.status,
    provider,
    transactionRef,
  };
}

function parseCachedWebhookResult(raw: unknown): PaymentWebhookResult | null {
  const parsed = typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
  if (!parsed || typeof parsed !== "object") return null;
  const record = parsed as Record<string, unknown>;
  if (
    typeof record.eventId !== "string" ||
    typeof record.orderCode !== "string" ||
    typeof record.orderId !== "string" ||
    typeof record.status !== "string" ||
    typeof record.paymentStatus !== "string" ||
    typeof record.version !== "number"
  ) {
    return null;
  }
  return {
    eventId: record.eventId,
    orderCode: record.orderCode,
    orderId: record.orderId,
    status: record.status,
    paymentStatus: record.paymentStatus,
    version: record.version,
    idempotentReplay: true,
  };
}

/** Settle or refund an order atomically with idempotency_keys and row-level locking. */
export async function processPostgresPaymentWebhook(
  database: CatalogSqlDatabase,
  payload: PaymentWebhookPayload,
): Promise<PaymentWebhookResult> {
  const idempotencyKey = `webhook:${payload.eventId}`;

  return database.transaction(async (conn) => {
    const claim = await conn.query(
      `INSERT INTO nari_orders.idempotency_keys (key, scope, status)
       VALUES ($1, 'payment_webhook', 'processing')
       ON CONFLICT (key) DO NOTHING
       RETURNING key`,
      [idempotencyKey],
    );

    if (claim.rows.length === 0) {
      const existingRes = await conn.query(
        `SELECT scope, status, response_body
         FROM nari_orders.idempotency_keys
         WHERE key = $1`,
        [idempotencyKey],
      );
      const existing = existingRes.rows[0];
      if (existing && existing.scope === "payment_webhook" && existing.status === "completed" && existing.response_body) {
        const cached = parseCachedWebhookResult(existing.response_body);
        if (cached) return cached;
      }
      throw new PaymentWebhookError("WEBHOOK_EVENT_CONFLICT", 409, "Sự kiện webhook đang được xử lý hoặc bị xung đột.");
    }

    const orderRes = await conn.query(
      `SELECT id, order_code, status, payment_status, total_amount, version
       FROM nari_orders.orders
       WHERE lower(order_code) = lower($1)
       FOR UPDATE`,
      [payload.orderCode],
    );

    if (orderRes.rows.length === 0) {
      throw new PaymentWebhookError("ORDER_NOT_FOUND", 404, "Không tìm thấy đơn hàng khớp mã giao dịch.");
    }

    const row = orderRes.rows[0];
    const orderId = String(row.id ?? "");
    const orderCode = String(row.order_code ?? "");
    const currentStatus = String(row.status ?? "");
    const currentPaymentStatus = String(row.payment_status ?? "unpaid");
    const totalAmount = Number(row.total_amount);
    const currentVersion = Number(row.version ?? 1);

    if (!Number.isSafeInteger(totalAmount) || totalAmount !== payload.amount) {
      throw new PaymentWebhookError("WEBHOOK_AMOUNT_MISMATCH", 400, "Số tiền giao dịch không khớp với giá trị đơn hàng.");
    }

    let finalStatus = currentStatus;
    let finalPaymentStatus = currentPaymentStatus;
    let finalVersion = currentVersion;

    if (payload.status === "paid") {
      if (currentStatus === "cancelled" || currentStatus === "returned") {
        throw new PaymentWebhookError("ORDER_CANNOT_BE_PAID", 409, "Không thể ghi nhận thanh toán cho đơn hàng đã hủy hoặc hoàn trả.");
      }
      if (currentPaymentStatus === "refunded") {
        throw new PaymentWebhookError("ORDER_ALREADY_REFUNDED", 409, "Đơn hàng đã được hoàn tiền trước đó.");
      }

      if (currentPaymentStatus !== "paid") {
        const nextStatus = currentStatus === "pending" ? "confirmed" : currentStatus;
        const updatedRes = await conn.query(
          `UPDATE nari_orders.orders
           SET payment_status = 'paid',
               status = $3,
               version = version + 1,
               updated_at = clock_timestamp()
           WHERE id = $1
             AND version = $2
           RETURNING status, payment_status, version`,
          [orderId, currentVersion, nextStatus],
        );
        if (updatedRes.rows.length !== 1) {
          throw new PaymentWebhookError("ORDER_VERSION_CONFLICT", 409, "Trạng thái đơn hàng vừa thay đổi đồng thời.");
        }
        const updated = updatedRes.rows[0];
        finalStatus = String(updated.status);
        finalPaymentStatus = String(updated.payment_status);
        finalVersion = Number(updated.version);

        await conn.query(
          `INSERT INTO nari_orders.order_events (
             id, order_id, from_status, to_status, actor_id, note
           )
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            randomUUID(),
            orderId,
            currentStatus,
            finalStatus,
            `webhook:${payload.provider}`,
            `Payment paid (${payload.transactionRef || payload.eventId})`,
          ],
        );
      }
    } else {
      if (currentPaymentStatus !== "paid") {
        throw new PaymentWebhookError("ORDER_NOT_PAID", 409, "Chỉ có thể hoàn tiền đối với đơn hàng đã thanh toán.");
      }

      const updatedRes = await conn.query(
        `UPDATE nari_orders.orders
         SET payment_status = 'refunded',
             version = version + 1,
             updated_at = clock_timestamp()
         WHERE id = $1
           AND version = $2
         RETURNING status, payment_status, version`,
        [orderId, currentVersion],
      );
      if (updatedRes.rows.length !== 1) {
        throw new PaymentWebhookError("ORDER_VERSION_CONFLICT", 409, "Trạng thái đơn hàng vừa thay đổi đồng thời.");
      }
      const updated = updatedRes.rows[0];
      finalStatus = String(updated.status);
      finalPaymentStatus = String(updated.payment_status);
      finalVersion = Number(updated.version);

      await conn.query(
        `INSERT INTO nari_orders.order_events (
           id, order_id, from_status, to_status, actor_id, note
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          orderId,
          currentStatus,
          finalStatus,
          `webhook:${payload.provider}`,
          `Payment refunded (${payload.transactionRef || payload.eventId})`,
        ],
      );
    }

    const resultBody = {
      eventId: payload.eventId,
      orderCode,
      orderId,
      status: finalStatus,
      paymentStatus: finalPaymentStatus,
      version: finalVersion,
    };

    await conn.query(
      `UPDATE nari_orders.idempotency_keys
       SET status = 'completed',
           response_status = 200,
           response_body = $2::jsonb
       WHERE key = $1`,
      [idempotencyKey, JSON.stringify(resultBody)],
    );

    return {
      ...resultBody,
      idempotentReplay: false,
    };
  });
}
