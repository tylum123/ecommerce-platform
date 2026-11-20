import { NextResponse, type NextRequest } from "next/server";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { checkPostgresScopedRateLimit, createSessionRateLimiter } from "@/lib/server/session-input";
import { hasTrustedMutationOrigin } from "@/lib/server/supabase-principal";
import { createSupabaseSession, readSupabaseSessionConfig, sessionResponse } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limitRecoveryLocal = createSessionRateLimiter();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  const empty = NextResponse.json({});

  try {
    const config = readSupabaseSessionConfig();
    if (!hasTrustedMutationOrigin(request, config.origin)) {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_ORIGIN", error: "Yêu cầu không hợp lệ." }, 403);
    }

    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_CONTENT_TYPE", error: "Định dạng dữ liệu không hợp lệ." }, 415);
    }

    let rawBody: string;
    try {
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 4096));
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return sessionResponse(empty, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
      }
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu JSON không hợp lệ." }, 400);
    }

    const email =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) && typeof (parsed as Record<string, unknown>).email === "string"
        ? String((parsed as Record<string, unknown>).email).trim().toLowerCase()
        : "";

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return sessionResponse(empty, { ok: false, success: false, code: "RECOVERY_EMAIL_INVALID", error: "Vui lòng nhập email hợp lệ." }, 400);
    }

    const retryAfter =
      process.env.NARI_SHARED_RATE_LIMIT === "postgres"
        ? await checkPostgresScopedRateLimit(getPostgresDatabase(), {
            scope: "recovery",
            globalKey: "global:recovery",
            identifier: email,
            maxRequests: 3,
            windowSeconds: 900,
            globalMaxRequests: 20,
            globalWindowSeconds: 60,
          })
        : limitRecoveryLocal(email);

    if (retryAfter) {
      const limited = sessionResponse(
        empty,
        { ok: false, success: false, code: "RATE_LIMITED", error: "Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng thử lại sau." },
        429,
      );
      limited.headers.set("Retry-After", String(retryAfter));
      return limited;
    }

    session = createSupabaseSession(request, config);
    await session.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${config.origin}/auth/callback?next=${encodeURIComponent("/khoi-phuc-mat-khau?mode=reset")}`,
    });

    // Always return a generic success response to prevent account email enumeration.
    return sessionResponse(session.response, {
      ok: true,
      success: true,
      message: "Nếu email đã đăng ký, hệ thống đã gửi liên kết đặt lại mật khẩu.",
    });
  } catch {
    return sessionResponse(
      session?.response ?? empty,
      { ok: false, success: false, code: "AUTH_UNAVAILABLE", error: "Chức năng khôi phục mật khẩu tạm chưa khả dụng." },
      503,
    );
  }
}

export async function PUT(request: NextRequest) {
  let session: ReturnType<typeof createSupabaseSession> | undefined;
  const empty = NextResponse.json({});

  try {
    const config = readSupabaseSessionConfig();
    if (!hasTrustedMutationOrigin(request, config.origin)) {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_ORIGIN", error: "Yêu cầu không hợp lệ." }, 403);
    }

    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_CONTENT_TYPE", error: "Định dạng dữ liệu không hợp lệ." }, 415);
    }

    let rawBody: string;
    try {
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 4096));
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return sessionResponse(empty, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
      }
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu JSON không hợp lệ." }, 400);
    }

    const password =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) && typeof (parsed as Record<string, unknown>).password === "string"
        ? String((parsed as Record<string, unknown>).password)
        : "";

    if (password.length < 8 || password.length > 128) {
      return sessionResponse(
        empty,
        { ok: false, success: false, code: "RECOVERY_PASSWORD_INVALID", error: "Mật khẩu mới phải từ 8 đến 128 ký tự." },
        400,
      );
    }

    session = createSupabaseSession(request, config);
    const { data: userData, error: userError } = await session.client.auth.getUser();
    if (userError || !userData.user) {
      return sessionResponse(
        session.response,
        { ok: false, success: false, code: "AUTHENTICATION_REQUIRED", error: "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn." },
        401,
      );
    }

    const { error: updateError } = await session.client.auth.updateUser({ password });
    if (updateError) {
      return sessionResponse(
        session.response,
        { ok: false, success: false, code: "PASSWORD_UPDATE_FAILED", error: "Không thể cập nhật mật khẩu mới. Vui lòng yêu cầu liên kết mới." },
        400,
      );
    }

    return sessionResponse(session.response, {
      ok: true,
      success: true,
      message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
    });
  } catch {
    return sessionResponse(
      session?.response ?? empty,
      { ok: false, success: false, code: "AUTH_UNAVAILABLE", error: "Chức năng đặt lại mật khẩu tạm chưa khả dụng." },
      503,
    );
  }
}
