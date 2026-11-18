import type { NextRequest } from "next/server";
import { authorizeCatalogRequest } from "@/lib/server/catalog-admin-access";
import { CatalogInputError, createCatalogAdminService } from "@/lib/server/catalog-admin-service";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { sessionResponse } from "@/lib/server/supabase-session";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: NextRequest) {
  const access = await authorizeCatalogRequest(request);
  if (access.response) return access.response;
  try {
    const service = createCatalogAdminService(getPostgresDatabase());
    if (request.method === "GET") return sessionResponse(access.template, { ok: true, ...await service.read() });
    if (!request.headers.get("content-type")?.startsWith("application/json")) return sessionResponse(access.template, { ok: false, code: "INVALID_CONTENT_TYPE" }, 415);
    const raw = new TextDecoder().decode(await readBoundedRequestBody(request, 512 * 1024));
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new CatalogInputError("INVALID_JSON"); }
    return sessionResponse(access.template, { ok: true, ...await service.mutate(body) });
  } catch (error) {
    if (error instanceof RequestBodyLimitError) return sessionResponse(access.template, { ok: false, code: "INPUT_TOO_LARGE" }, 413);
    const code = error instanceof Error ? error.message : "";
    const sqlCode = error && typeof error === "object" && "code" in error ? error.code : "";
    const conflict = code === "CATALOG_EDIT_CONFLICT" || sqlCode === "23505";
    const validation = error instanceof CatalogInputError || /^CATALOG_(PRODUCT|IMAGES|SPECS|URL|BANNERS|INTEGER).*INVALID$/.test(code) || sqlCode === "23503" || sqlCode === "23514";
    const status = error instanceof CatalogInputError ? error.status : conflict ? 409 : validation ? 400 : 503;
    return sessionResponse(access.template, { ok: false, code: conflict ? "CATALOG_EDIT_CONFLICT" : status === 503 ? "CATALOG_UNAVAILABLE" : "INVALID_INPUT", error: status === 409 ? "Sản phẩm đã thay đổi hoặc SKU/đường dẫn đã tồn tại. Tải lại danh mục trước khi sửa tiếp." : status === 503 ? "Không thể lưu hoặc tải danh mục. Vui lòng thử lại." : "Dữ liệu không hợp lệ. Kiểm tra các trường đã nhập." }, status);
  }
}
export const GET = handle;
export const POST = handle;
