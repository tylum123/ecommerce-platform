import "server-only";
import type { StoreBranchInfo } from "@/lib/backend-contracts";
import type { CatalogSqlConnection } from "@/lib/server/postgres-catalog-repository";

export interface PostgresBranchFilter {
  city?: string;
  district?: string;
  query?: string;
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("BRANCH_ROW_INVALID");
  return value;
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Query active, non-demo branches from PostgreSQL for Store Locator and Checkout. */
export async function listPostgresBranches(
  database: CatalogSqlConnection,
  filter?: PostgresBranchFilter,
): Promise<StoreBranchInfo[]> {
  const conditions: string[] = [
    "b.is_active = true",
    "NOT b.is_demo",
    "(b.source_id IS NULL OR s.verification_state = 'merchant')",
  ];
  const values: unknown[] = [];

  const city = filter?.city?.trim();
  if (city && city !== "Tất cả Tỉnh/Thành") {
    values.push(city);
    conditions.push(`LOWER(b.city) = LOWER($${values.length})`);
  }

  const district = filter?.district?.trim();
  if (district && district !== "Tất cả Quận/Huyện") {
    values.push(district);
    conditions.push(`LOWER(b.district) = LOWER($${values.length})`);
  }

  const queryText = filter?.query?.trim();
  if (queryText) {
    values.push(`%${escapeLikePattern(queryText)}%`);
    const idx = `$${values.length}`;
    conditions.push(
      `(b.name ILIKE ${idx} ESCAPE '\\' OR b.address ILIKE ${idx} ESCAPE '\\' OR b.city ILIKE ${idx} ESCAPE '\\' OR b.district ILIKE ${idx} ESCAPE '\\')`,
    );
  }

  const result = await database.query(
    `SELECT b.id, b.name, b.address, b.city, b.district, b.phone, b.supports_nowfree_2h
     FROM nari_catalog.branches b
     LEFT JOIN nari_catalog.sources s ON s.id = b.source_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY b.city ASC, b.district ASC, b.name ASC, b.id ASC`,
    values,
  );

  return result.rows.map((row) => ({
    id: text(row.id),
    name: text(row.name),
    address: text(row.address),
    city: text(row.city),
    district: text(row.district),
    ...(typeof row.phone === "string" && row.phone.trim() ? { phone: row.phone } : {}),
    hasClinic: false,
    supportsNowfree2h: Boolean(row.supports_nowfree_2h),
  }));
}

/** Safe SSR loader for Store Locator and Checkout pages; never throws when DB is absent/unavailable. */
export async function readPostgresBranchesSafely(
  getDatabase: () => CatalogSqlConnection,
  filter?: PostgresBranchFilter,
): Promise<StoreBranchInfo[]> {
  if (!process.env.NARI_POSTGRES_URL?.trim()) return [];
  try {
    return await listPostgresBranches(getDatabase(), filter);
  } catch {
    return [];
  }
}
