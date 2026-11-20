import { NextResponse } from "next/server";
import { authenticationRequired, serviceUnavailable } from "@/lib/server/access-policy";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";
import { ClinicBookingError, createPostgresBooking } from "@/lib/server/postgres-clinic-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { hasTrustedMutationOrigin } from "@/lib/server/supabase-principal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function bookingErrorMessage(code: string): string {
  switch (code) {
    case "BOOKING_SLOT_CONFLICT":
      return "Khung giờ này tại chi nhánh đã có lịch hẹn khác. Vui lòng chọn khung giờ hoặc chi nhánh khác.";
    case "CLINIC_BRANCH_NOT_FOUND":
      return "Chi nhánh phòng khám không tồn tại hoặc chưa kích hoạt dịch vụ Clinic.";
    case "CLINIC_SERVICE_NOT_FOUND":
      return "Dịch vụ phòng khám không tồn tại hoặc tạm ngừng hoạt động.";
    case "BOOKING_PHONE_INVALID":
      return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
    case "BOOKING_DATETIME_INVALID":
      return "Ngày hoặc giờ đặt hẹn không hợp lệ.";
    case "BOOKING_DURATION_INVALID":
      return "Thời lượng dịch vụ không hợp lệ (15 - 240 phút).";
    default:
      return "Vui lòng điền đầy đủ thông tin đặt hẹn hợp lệ.";
  }
}

export async function GET() {
  if (process.env.NARI_BOOKINGS_ENABLED !== "true") {
    return authenticationRequired();
  }
  return authenticationRequired();
}

export async function POST(request: Request) {
  if (process.env.NARI_BOOKINGS_ENABLED !== "true") {
    return serviceUnavailable();
  }

  const applicationOrigin = process.env.APP_ORIGIN?.trim() || "";
  if (!applicationOrigin) {
    return serviceUnavailable();
  }

  if (!hasTrustedMutationOrigin(request, applicationOrigin)) {
    return NextResponse.json(
      {
        ok: false,
        success: false,
        code: "INVALID_ORIGIN",
        error: "Yêu cầu không hợp lệ.",
      },
      { status: 403, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    const bytes = await readBoundedRequestBody(request, 64 * 1024);
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const parsed: unknown = JSON.parse(decoded);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          code: "BOOKING_INPUT_INVALID",
          error: "Dữ liệu đặt hẹn không hợp lệ.",
        },
        { status: 400, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          code: "INPUT_TOO_LARGE",
          error: "Dữ liệu gửi lên vượt quá giới hạn cho phép.",
        },
        { status: 413, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        success: false,
        code: "BOOKING_INPUT_INVALID",
        error: "Dữ liệu đặt hẹn không hợp lệ.",
      },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const customerName =
    typeof body.customerName === "string" ? body.customerName : typeof body.name === "string" ? body.name : "";
  const customerPhone =
    typeof body.customerPhone === "string" ? body.customerPhone : typeof body.phone === "string" ? body.phone : "";
  const branchId = typeof body.branchId === "string" ? body.branchId : "";
  const serviceId = typeof body.serviceId === "string" ? body.serviceId : undefined;
  const serviceName =
    typeof body.serviceName === "string" ? body.serviceName : typeof body.service === "string" ? body.service : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const durationMinutes =
    body.durationMinutes === undefined
      ? undefined
      : typeof body.durationMinutes === "number"
        ? body.durationMinutes
        : Number.NaN;
  const notes = typeof body.notes === "string" ? body.notes : "";

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
    const booking = await createPostgresBooking(getPostgresDatabase(), {
      customerName,
      customerPhone,
      branchId,
      serviceId,
      serviceName,
      date,
      time,
      durationMinutes,
      notes,
      userId: verifiedUserId,
    });
    return NextResponse.json(
      {
        ok: true,
        success: true,
        bookingCode: booking.bookingCode,
        booking,
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    if (error instanceof ClinicBookingError) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          code: error.code,
          error: bookingErrorMessage(error.code),
        },
        { status: error.status, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    return serviceUnavailable();
  }
}
