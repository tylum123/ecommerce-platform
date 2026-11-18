import "server-only";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface CatalogStorageConfig {
  supabaseUrl: string;
  serviceRoleKey: string;
  bucket: string;
  /** Exact approved public origin; must match the Supabase project URL. */
  publicOrigin: string;
}

function validateConfig(config: CatalogStorageConfig) {
  let project: URL;
  let origin: URL;
  try { project = new URL(config.supabaseUrl); origin = new URL(config.publicOrigin); } catch { throw new Error("CATALOG_STORAGE_CONFIG_INVALID"); }
  if (project.protocol !== "https:" || project.username || project.password || project.pathname !== "/" || project.search || project.hash ||
      origin.href !== `${origin.origin}/` || origin.origin !== project.origin || !config.serviceRoleKey.trim() ||
      !/^[a-z0-9][a-z0-9_-]{0,62}$/.test(config.bucket)) throw new Error("CATALOG_STORAGE_CONFIG_INVALID");
  return project.origin;
}

function imageType(bytes: Uint8Array): { extension: string; mime: string } {
  if (bytes.length < 12 || bytes.length > 6 * 1024 * 1024) throw new Error("CATALOG_STORAGE_SIZE_INVALID");
  if ([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((b, i) => bytes[i] === b)) return { extension: "png", mime: "image/png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", mime: "image/jpeg" };
  if (String.fromCharCode(...bytes.subarray(0,4)) === "RIFF" && String.fromCharCode(...bytes.subarray(8,12)) === "WEBP") return { extension: "webp", mime: "image/webp" };
  throw new Error("CATALOG_STORAGE_TYPE_INVALID");
}

/** Durable object-storage adapter; call only after products:write and CSRF checks.
 * Bucket provisioning/access policy is a reviewed deployment step. No local fallback.
 */
export function createCatalogStorage(config: CatalogStorageConfig, suppliedClient?: SupabaseClient) {
  const origin = validateConfig(config);
  const client = suppliedClient ?? createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return {
    async upload(bytes: Uint8Array, declaredMime: string) {
      const type = imageType(bytes);
      if (type.mime !== declaredMime) throw new Error("CATALOG_STORAGE_TYPE_INVALID");
      const path = `catalog/${randomUUID()}.${type.extension}`;
      const bucket = client.storage.from(config.bucket);
      const { data, error } = await bucket.upload(path, bytes, { contentType: type.mime, upsert: false, cacheControl: "31536000" });
      if (error || data?.path !== path) throw new Error("CATALOG_STORAGE_UPLOAD_FAILED");
      // A successful PUT does not prove bucket publicity. Live readback is a cutover gate.
      const url = `${origin}/storage/v1/object/public/${config.bucket}/${path}`;
      return { url, bucket: config.bucket, path, contentType: type.mime, size: bytes.length };
    },
  };
}
