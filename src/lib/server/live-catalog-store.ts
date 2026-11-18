import { getSqliteDb } from "@/lib/sqlite-db";
import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";

export function catalogBackend(): "sqlite" | "postgres" {
  const backend = process.env.NARI_CATALOG_BACKEND;
  if (backend === "postgres") return backend;
  if (backend === "sqlite" && process.env.NODE_ENV !== "production") return backend;
  if (backend || process.env.NODE_ENV === "production") throw new Error("CATALOG_BACKEND_REQUIRED");
  return "sqlite";
}

function requireSqlite() {
  if (catalogBackend() !== "sqlite") throw new Error("CATALOG_LEGACY_SQLITE_DISABLED");
}

/** Runtime catalog source. Database failures must reach the caller, never become success. */
export function readLiveCatalog(): LiveCatalogOverridesState {
  requireSqlite();
  const row = getSqliteDb().prepare(
    "SELECT value FROM system_settings WHERE key = 'live_catalog_overrides'",
  ).get() as { value: string } | undefined;
  if (!row) return getStaticCatalogOverrides();
  const state: LiveCatalogOverridesState = JSON.parse(row.value);
  if (!state || !Array.isArray(state.deletedSlugs) || !state.products ||
      !Array.isArray(state.banners?.heroSlides) || !Array.isArray(state.banners?.sideBanners)) {
    throw new Error("CATALOG_STORAGE_INVALID");
  }
  return state;
}

export function writeLiveCatalog(state: LiveCatalogOverridesState): void {
  requireSqlite();
  state.updatedAt = new Date().toISOString();
  getSqliteDb().prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('live_catalog_overrides', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(JSON.stringify(state), state.updatedAt);
}

/** Public page props exclude hidden product contents; tombstones still suppress snapshots. */
export async function readStorefrontCatalog(): Promise<LiveCatalogOverridesState> {
  if (catalogBackend() === "postgres") {
    try {
      const [{ getPostgresDatabase }, { readPostgresStorefrontCatalog }] = await Promise.all([
        import("@/lib/server/postgres-database"), import("@/lib/server/postgres-catalog-repository"),
      ]);
      return await readPostgresStorefrontCatalog(getPostgresDatabase());
    } catch {
      // Public entries must never expose connection strings or raw driver errors.
      throw new Error("CATALOG_POSTGRES_UNAVAILABLE");
    }
  }
  const state = readLiveCatalog();
  const deleted = new Set(state.deletedSlugs);
  return { ...state, products: Object.fromEntries(Object.entries(state.products).filter(([slug]) => !deleted.has(slug))) };
}
