import { NextResponse, type NextRequest } from "next/server";
import { serviceUnavailable } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export async function POST(request: NextRequest) {
  const secret = process.env.NARI_PAYMENT_WEBHOOK_SECRET?.trim() || "";
  if (process.env.NARI_PAYMENT_WEBHOOK_ENABLED !== "true" || secret.length < 16) {
    return serviceUnavailable();
  }

  try {
    const [
      { readBoundedRequestBody, RequestBodyLimitError },
      { getPostgresDatabase },
      {
        PaymentWebhookError,
        parsePaymentWebhookPayload,
        processPostgresPaymentWebhook,
        verifyPaymentWebhookSignature,
      },
    ] = await Promise.all([
      import("@/lib/server/bounded-request-body"),
      import("@/lib/server/postgres-database"),
      import("@/lib/server/postgres-payment-webhook-service"),
    ]);

    let rawBody: string;
    try {
      const bytes = await readBoundedRequestBody(request, MAX_WEBHOOK_BODY_BYTES);
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return NextResponse.json(
          { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu webhook vượt quá giới hạn." },
          { status: 413, headers: NO_STORE_HEADERS },
        );
      }
      return NextResponse.json(
        { ok: false, success: false, code: "WEBHOOK_PAYLOAD_INVALID", error: "Dữ liệu webhook không hợp lệ." },
        { status: 400, headers: NO_STORE_HEADERS },
      );
    }

    try {
      verifyPaymentWebhookSignature({
        rawBody,
        signatureHeader: request.headers.get("x-nari-signature"),
        timestampHeader: request.headers.get("x-nari-timestamp"),
        secret,
      });
      const payload = parsePaymentWebhookPayload(rawBody);
      const result = await processPostgresPaymentWebhook(getPostgresDatabase(), payload);
      return NextResponse.json(
        { ok: true, success: true, ...result },
        { status: 200, headers: NO_STORE_HEADERS },
      );
    } catch (error) {
      if (error instanceof PaymentWebhookError) {
        return NextResponse.json(
          { ok: false, success: false, code: error.code, error: error.message },
          { status: error.status, headers: NO_STORE_HEADERS },
        );
      }
      return serviceUnavailable();
    }
  } catch {
    return serviceUnavailable();
  }
}
