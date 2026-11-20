import { NextResponse, type NextRequest } from "next/server";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { ensureCustomerProfile } from "@/lib/server/postgres-customer-service";
import { checkPostgresScopedRateLimit, createSessionRateLimiter } from "@/lib/server/session-input";
import { hasTrustedMutationOrigin } from "@/lib/server/supabase-principal";
import { createSupabaseSession, readSupabaseSessionConfig, sessionResponse } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const limitSignupLocal = createSessionRateLimiter();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^0\d{9}$/;
const FORBIDDEN_FIELDS = new Set(["role", "tier", "loyaltyPoints", "loyalty_points", "permissions", "branchId"]);

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
      rawBody = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 8 * 1024));
    } catch (error) {
      if (error instanceof RequestBodyLimitError) {
        return sessionResponse(empty, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu đăng ký quá lớn." }, 413);
      }
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu đăng ký không hợp lệ." }, 400);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu JSON không hợp lệ." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(empty, { ok: false, success: false, code: "INVALID_INPUT", error: "Dữ liệu đăng ký không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    for (const key of Object.keys(body)) {
      if (FORBIDDEN_FIELDS.has(key)) {
        return sessionResponse(
          empty,
          { ok: false, success: false, code: "REGISTRATION_FIELDS_FORBIDDEN", error: "Không được tự chỉ định quyền hoặc hạng thành viên khi đăng ký." },
          400,
        );
      }
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (fullName.length < 2 || fullName.length > 160) {
      return sessionResponse(empty, { ok: false, success: false, code: "REGISTER_NAME_INVALID", error: "Vui lòng nhập họ và tên hợp lệ (2 - 160 ký tự)." }, 400);
    }
    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return sessionResponse(empty, { ok: false, success: false, code: "REGISTER_EMAIL_INVALID", error: "Vui lòng nhập địa chỉ email hợp lệ." }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return sessionResponse(empty, { ok: false, success: false, code: "REGISTER_PASSWORD_INVALID", error: "Mật khẩu phải từ 8 đến 128 ký tự." }, 400);
    }
    if (phone && !PHONE_REGEX.test(phone)) {
      return sessionResponse(empty, { ok: false, success: false, code: "REGISTER_PHONE_INVALID", error: "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0." }, 400);
    }

    const db = getPostgresDatabase();
    const retryAfter =
      process.env.NARI_SHARED_RATE_LIMIT === "postgres"
        ? await checkPostgresScopedRateLimit(db, {
            scope: "signup",
            globalKey: "global:signup",
            identifier: email,
            maxRequests: 5,
            windowSeconds: 900,
            globalMaxRequests: 30,
            globalWindowSeconds: 60,
          })
        : limitSignupLocal(email);

    if (retryAfter) {
      const limited = sessionResponse(
        empty,
        { ok: false, success: false, code: "RATE_LIMITED", error: "Bạn đã thử đăng ký quá nhiều lần. Vui lòng thử lại sau." },
        429,
      );
      limited.headers.set("Retry-After", String(retryAfter));
      return limited;
    }

    session = createSupabaseSession(request, config);
    const { data, error } = await session.client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${config.origin}/auth/callback?next=/khach-hang/tai-khoan`,
        data: { full_name: fullName },
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      const isConflict = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
      return sessionResponse(
        session.response,
        {
          ok: false,
          success: false,
          code: isConflict ? "EMAIL_ALREADY_REGISTERED" : "REGISTRATION_FAILED",
          error: isConflict
            ? "Email này đã được đăng ký. Vui lòng đăng nhập hoặc khôi phục mật khẩu."
            : "Không thể hoàn tất đăng ký lúc này. Vui lòng kiểm tra thông tin và thử lại.",
        },
        isConflict ? 409 : 400,
      );
    }

    if (!data.user?.id || (Array.isArray(data.user.identities) && data.user.identities.length === 0)) {
      return sessionResponse(
        session.response,
        {
          ok: false,
          success: false,
          code: "EMAIL_ALREADY_REGISTERED",
          error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc khôi phục mật khẩu.",
        },
        409,
      );
    }

    await ensureCustomerProfile(db, {
      userId: data.user.id,
      email,
      fullName,
      phone,
    });

    const requiresEmailConfirmation = !data.session;
    return sessionResponse(
      session.response,
      {
        ok: true,
        success: true,
        requiresEmailConfirmation,
        user: { id: data.user.id, email },
        message: requiresEmailConfirmation
          ? "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập."
          : "Đăng ký tài khoản thành công!",
      },
      201,
    );
  } catch {
    return sessionResponse(
      session?.response ?? empty,
      { ok: false, success: false, code: "AUTH_UNAVAILABLE", error: "Chức năng đăng ký tạm chưa khả dụng. Vui lòng thử lại sau." },
      503,
    );
  }
}
