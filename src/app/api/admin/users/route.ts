import { NextResponse, type NextRequest } from "next/server";
import { authenticationRequired } from "@/lib/server/access-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" } as const;

export async function GET(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest },
    { getPostgresDatabase },
    { sessionResponse },
    { ErpServiceError, listPostgresAdminUsers },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "users:read",
  });
  if (access.response) return access.response;

  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || undefined;
    const tier = url.searchParams.get("tier") || undefined;
    const status = url.searchParams.get("status") || undefined;

    const users = await listPostgresAdminUsers(getPostgresDatabase(), { search, tier, status });
    return sessionResponse(access.template, { ok: true, success: true, users, total: users.length });
  } catch (error) {
    if (error instanceof ErpServiceError) {
      return sessionResponse(access.template, { ok: false, success: false, code: error.code, error: error.message }, error.status);
    }
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_USERS_UNAVAILABLE", error: "Không thể tải danh sách khách hàng." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest },
    { readBoundedRequestBody, RequestBodyLimitError },
    { getPostgresDatabase },
    { sessionResponse },
    { ErpServiceError, createPostgresAdminCustomerProfile },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/bounded-request-body"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "users:manage",
  });
  if (access.response) return access.response;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 32 * 1024));
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }
    const body = parsed as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const tier = typeof body.tier === "string" ? body.tier : "Member";
    let userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!userId) {
      const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
      if (!supabaseUrl || !serviceRoleKey) {
        return sessionResponse(
          access.template,
          {
            ok: false,
            success: false,
            code: "CUSTOMER_PROVISIONING_UNAVAILABLE",
            error: "Chưa cấu hình SUPABASE_SERVICE_ROLE_KEY để tạo tài khoản Auth mới từ cổng quản trị.",
          },
          501,
        );
      }

      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const created = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (created.error || !created.data.user?.id) {
        return sessionResponse(
          access.template,
          {
            ok: false,
            success: false,
            code: "AUTH_PROVISIONING_FAILED",
            error: created.error?.message || "Không thể khởi tạo tài khoản Supabase Auth cho khách hàng.",
          },
          409,
        );
      }
      userId = created.data.user.id;
    }

    const user = await createPostgresAdminCustomerProfile(getPostgresDatabase(), {
      userId,
      email,
      fullName,
      phone,
      address,
      tier: tier as "Member" | "Silver" | "Gold" | "Diamond",
    });

    return sessionResponse(
      access.template,
      { ok: true, success: true, message: "Tạo khách hàng mới thành công", user },
      201,
    );
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
    }
    if (error instanceof SyntaxError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "JSON không hợp lệ." }, 400);
    }
    if (error instanceof ErpServiceError) {
      return sessionResponse(access.template, { ok: false, success: false, code: error.code, error: error.message }, error.status);
    }
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_USERS_UNAVAILABLE", error: "Không thể tạo hồ sơ khách hàng." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (process.env.NARI_ERP_ADMIN_ENABLED !== "true") {
    return authenticationRequired();
  }

  const [
    { authorizeBusinessRequest },
    { readBoundedRequestBody, RequestBodyLimitError },
    { getPostgresDatabase },
    { sessionResponse },
    { ErpServiceError, updatePostgresAdminUser },
  ] = await Promise.all([
    import("@/lib/server/business-access"),
    import("@/lib/server/bounded-request-body"),
    import("@/lib/server/postgres-database"),
    import("@/lib/server/supabase-session"),
    import("@/lib/server/postgres-erp-service"),
  ]);

  const access = await authorizeBusinessRequest(request, {
    flagEnv: "NARI_ERP_ADMIN_ENABLED",
    permission: "users:manage",
  });
  if (access.response) return access.response;

  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(await readBoundedRequestBody(request, 32 * 1024));
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "Dữ liệu không hợp lệ." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) {
      return sessionResponse(
        access.template,
        { ok: false, success: false, code: "USER_ID_REQUIRED", error: "Thiếu ID khách hàng cần cập nhật." },
        400,
      );
    }

    const patchSource =
      body.patch && typeof body.patch === "object" && !Array.isArray(body.patch)
        ? (body.patch as Record<string, unknown>)
        : body;

    const updated = await updatePostgresAdminUser(getPostgresDatabase(), id, {
      fullName: typeof patchSource.fullName === "string" ? patchSource.fullName : undefined,
      phone: typeof patchSource.phone === "string" ? patchSource.phone : undefined,
      address: typeof patchSource.address === "string" ? patchSource.address : undefined,
      tier: typeof patchSource.tier === "string" ? (patchSource.tier as "Member" | "Silver" | "Gold" | "Diamond") : undefined,
      loyaltyPoints: typeof patchSource.loyaltyPoints === "number" ? patchSource.loyaltyPoints : undefined,
      loyaltyPointsDelta: typeof patchSource.loyaltyPointsDelta === "number" ? patchSource.loyaltyPointsDelta : undefined,
      status: typeof patchSource.status === "string" ? patchSource.status : undefined,
    });

    return sessionResponse(access.template, {
      ok: true,
      success: true,
      message: "Cập nhật hồ sơ khách hàng thành công",
      user: updated,
    });
  } catch (error) {
    if (error instanceof RequestBodyLimitError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INPUT_TOO_LARGE", error: "Dữ liệu quá lớn." }, 413);
    }
    if (error instanceof SyntaxError) {
      return sessionResponse(access.template, { ok: false, success: false, code: "INVALID_JSON", error: "JSON không hợp lệ." }, 400);
    }
    if (error instanceof ErpServiceError) {
      return sessionResponse(access.template, { ok: false, success: false, code: error.code, error: error.message }, error.status);
    }
    return NextResponse.json(
      { ok: false, success: false, code: "ERP_USERS_UNAVAILABLE", error: "Không thể cập nhật hồ sơ khách hàng." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
