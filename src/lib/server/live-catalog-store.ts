import type { LiveCatalogOverridesState } from "@/lib/live-catalog";

export function catalogBackend(): "postgres" {
  const backend = process.env.NARI_CATALOG_BACKEND;
  if (backend === "postgres") return "postgres";
  if (!backend && process.env.NODE_ENV !== "production") return "postgres";
  throw new Error("CATALOG_BACKEND_REQUIRED");
}

/** Public page props exclude hidden product contents; tombstones still suppress snapshots. */
export async function readStorefrontCatalog(): Promise<LiveCatalogOverridesState> {
  catalogBackend();
  try {
    const [{ getPostgresDatabase }, { readPostgresStorefrontCatalog }] = await Promise.all([
      import("@/lib/server/postgres-database"),
      import("@/lib/server/postgres-catalog-repository"),
    ]);
    return await readPostgresStorefrontCatalog(getPostgresDatabase());
  } catch {
    // Public entries must never expose connection strings or raw driver errors.
    throw new Error("CATALOG_POSTGRES_UNAVAILABLE");
  }
}
