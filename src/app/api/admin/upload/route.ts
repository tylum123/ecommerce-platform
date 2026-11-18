import type { NextRequest } from "next/server";
import { authorizeCatalogRequest } from "@/lib/server/catalog-admin-access";
import { createCatalogStorage } from "@/lib/server/catalog-storage";
import { sessionResponse } from "@/lib/server/supabase-session";
import { readBoundedRequestBody, RequestBodyLimitError } from "@/lib/server/bounded-request-body";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const access = await authorizeCatalogRequest(request);
  if (access.response) return access.response;
  const reply = (body: object, status = 200) => sessionResponse(access.template, body, status);
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return reply({ ok: false, code: "INVALID_CONTENT_TYPE" }, 415);
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES + 65536) return reply({ ok: false, code: "IMAGE_TOO_LARGE" }, 413);
  try {
    if (process.env.SUPABASE_URL !== process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("CATALOG_STORAGE_CONFIG_INVALID");
    const storage = createCatalogStorage({ supabaseUrl: process.env.SUPABASE_URL || "", serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "", bucket: process.env.NARI_STORAGE_BUCKET || "", publicOrigin: process.env.NARI_STORAGE_PUBLIC_ORIGIN || "" });
    const bytes = await readBoundedRequestBody(request, MAX_IMAGE_BYTES + 65536);
    const bounded = new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type") || "" } });
    const file = (await bounded.formData()).get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX_IMAGE_BYTES) return reply({ ok: false, error: "Chỉ nhận JPEG, PNG hoặc WebP tối đa 5 MB." }, 400);
    const saved = await storage.upload(new Uint8Array(await file.arrayBuffer()), file.type);
    return reply({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof RequestBodyLimitError) return reply({ ok: false, code: "IMAGE_TOO_LARGE" }, 413);
    const invalid = error instanceof Error && /^CATALOG_STORAGE_(TYPE|SIZE)_INVALID$/.test(error.message);
    return reply({ ok: false, code: invalid ? "INVALID_IMAGE" : "UPLOAD_FAILED", error: invalid ? "Nội dung ảnh không hợp lệ." : "Không thể lưu ảnh. Vui lòng thử lại." }, invalid ? 400 : 503);
  }
}
