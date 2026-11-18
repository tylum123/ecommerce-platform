import "server-only";
import type { CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";
import type { LiveProductOverride } from "@/lib/live-catalog";
import { readPostgresCatalog, replacePostgresBanners, setPostgresProductHidden, upsertPostgresProduct } from "@/lib/server/postgres-catalog-repository";

/** Internal domain capability, never an authorization boundary or a public route.
 * Server entry points must authorize before calling mutations. No SQLite fallback.
 */
export function createPostgresCatalogService(database: CatalogSqlDatabase) {
  return {
    read: () => readPostgresCatalog(database),
    upsert: (product: LiveProductOverride, references: Parameters<typeof upsertPostgresProduct>[2]) => upsertPostgresProduct(database, product, references),
    setHidden: (id: string, hidden: boolean, version: string) => setPostgresProductHidden(database, id, hidden, version),
    replaceBanners: (banners: Parameters<typeof replacePostgresBanners>[1]) => replacePostgresBanners(database, banners),
  };
}
