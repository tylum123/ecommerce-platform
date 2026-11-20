import { NextResponse, type NextRequest } from "next/server";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import {
  CustomerProfileError,
  getCustomerPortalData,
  updateCustomerProfile,
} from "@/lib/server/postgres-customer-service";
import { hasTrustedMutationOrigin } from "@/lib/server/supabase-principal";
import { createSupabaseSession, readSupabaseSessionConfig, sessionResponse } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_PATCH_KEYS = new Set(["fullName", "phone", "defaultAddress"]);
const FORBIDDEN_PATCH_KEYS = new Set(["tier", "loyaltyPoints", "loyalty_points", "role", "userId", "user_id", "email"]);

export async function GET(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  const empty = NextResponse.json({});

  try {
    const config = readSupabaseSessionConfig();
    session = createSupabaseSession(request, config);
    const { data, error } = await session.client.auth.getUser();
    if (error || !data.user?.id) {
      return sessionResponse(
        session.response,
        { ok: false, success: false, code: "AUTHENTICATION_REQUIRED", error: "Vui lòng đăng nhập để xem thông tin tài khoản." },
        401,
      );
    }

    const fullName =
      data.user.user_metadata && typeof data.user.user_metadata.full_name === "string"
        ? data.user.user_metadata.full_name
        : "";
    const portal = await getCustomerPortalData(getPostgresDatabase(), {
      id: data.user.id,
      email: data.user.email || "",
      fullName,
      phone: data.user.phone || "",
    });

    return sessionResponse(session.response, { ok: true, success: true, ...portal }, 200);
  } catch (error) {
    if (error instanceof CustomerProfileError) {
      return sessionResponse(
        session?.response ?? empty,
        { ok: false, success: false, code: error.code, error: error.message },
        error.status,
      );
    }
    return sessionResponse(
      session?.response ?? empty,
      { ok: false, success: false, code: "CUSTOMER_PORTAL_UNAVAILABLE", error: "Cổng thông tin khách hàng tạm chưa khả dụng." },
      503,
    );
  }
}

export async function PATCH(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  const empty = NextResponse.json({});

  try {
    const config = readSupabaseSessionConfig();
    if (!hasTrustedMutationOrigin(request, config.origin)) {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_ORIGIN", error: "Yêu cầu không hợp lệ." }, 403);
    }

    session = createSupabaseSession(request, config);
    const { data, error } = await session.client.auth.getUser();
    if (error || !data.user?.id) {
      return sessionResponse(
        session.response,
        { ok: false, success: false, code: "AUTHENTICATION_REQUIRED", error: "Vui lòng đăng nhập để cập nhật hồ sơ." },
        401,
      );
    }

    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return sessionResponse(
        session.response,
        { ok: false, success: false, code: "INVALID_CONTENT_TYPE", error: "Định dạng dữ liệu không hợp lệ." },
        415,
      );
    }

    let rawBody: string;
    try {
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 16 * 1024));
    } catch (bodyErr) {
      if (bodyErr instanceof RequestBodyLimitError) {
        return sessionResponse(session.response, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
      }
      return sessionResponse(session.response, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return sessionResponse(session.response, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu JSON không hợp lệ." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(session.response, { ok: false, success: false, code: "INVALID_INPUT", error: "Dữ liệu hồ sơ không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const keys = Object.keys(body);
    if (keys.length === 0) {
      return sessionResponse(session.response, { ok: false, success: false, code: "EMPTY_UPDATE", error: "Không có trường cần cập nhật." }, 400);
    }

    for (const key of keys) {
      if (FORBIDDEN_PATCH_KEYS.has(key) || !ALLOWED_PATCH_KEYS.has(key)) {
        return sessionResponse(
          session.response,
          { ok: false, success: false, code: "PROFILE_FIELDS_FORBIDDEN", error: `Trường '${key}' không được phép tự chỉnh sửa.` },
          400,
        );
      }
    }

    const profile = await updateCustomerProfile(getPostgresDatabase(), data.user.id, {
      fullName: typeof body.fullName === "string" ? body.fullName : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      defaultAddress: typeof body.defaultAddress === "string" ? body.defaultAddress : undefined,
    });

    return sessionResponse(session.response, {
      ok: true,
      success: true,
      message: "Đã cập nhật hồ sơ thành công.",
      profile,
    });
  } catch (error) {
    if (error instanceof CustomerProfileError) {
      return sessionResponse(
        session?.response ?? empty,
        { ok: false, success: false, code: error.code, error: error.message },
        error.status,
      );
    }
    return sessionResponse(
      session?.response ?? empty,
      { ok: false, success: false, code: "CUSTOMER_PORTAL_UNAVAILABLE", error: "Không thể cập nhật hồ sơ khách hàng lúc này." },
      503,
    );
  }
}
