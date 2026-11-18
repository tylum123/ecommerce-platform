import type { LiveCatalogOverridesState, LiveProductOverride, ManagedCatalogProduct } from "@/lib/live-catalog";

/** A server-owned SQL connection. The caller supplies a real PostgreSQL driver;
 * browser Supabase clients and service keys must never implement this boundary.
 */
export interface CatalogSqlConnection {
  query(sql: string, values?: readonly unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

export interface CatalogSqlDatabase extends CatalogSqlConnection {
  /** Driver must BEGIN/COMMIT on one connection and ROLLBACK when callback rejects. */
  transaction<T>(operation: (connection: CatalogSqlConnection) => Promise<T>): Promise<T>;
}

/** Only explicit merchant authoring; demo/source provenance cannot be supplied by callers. */
export async function createPostgresCatalogReference(database: CatalogSqlConnection, input: {
  kind: "brand" | "category"; id: string; label: string; slug: string; parentId?: string;
}) {
  if (input.kind === "brand") return database.query(
    "INSERT INTO nari_catalog.brands (id,name,slug) VALUES ($1,$2,$3) RETURNING id,name AS label,slug", [input.id,input.label,input.slug]);
  return database.query(
    "INSERT INTO nari_catalog.categories (id,name,slug,parent_id) VALUES ($1,$2,$3,$4) RETURNING id,name AS label,slug,parent_id AS \"parentId\"", [input.id,input.label,input.slug,input.parentId || null]);
}

function mediaUrl(value: string): string {
  if (value.includes("\\") || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) throw new Error("CATALOG_URL_INVALID");
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try { if (new URL(value).protocol === "https:") return value; } catch { /* Reject below. */ }
  throw new Error("CATALOG_URL_INVALID");
}

/** Internal repository, not an authorization boundary. Caller must verify the
 * principal, permission, CSRF and ownership before invoking a mutation.
 * Existing SKU/slug are immutable; expectedUpdatedAt is required for updates.
 */
export async function upsertPostgresProduct(
  database: CatalogSqlDatabase,
  product: LiveProductOverride,
  references: { brandId: string; categoryId: string; expectedUpdatedAt?: string },
): Promise<void> {
  const price = integer(product.price);
  const old = integer(product.old);
  if (old < price || !product.id || !product.name.trim() || !/^[A-Za-z0-9_-]{1,80}$/.test(product.sku) || !/^[a-z0-9][a-z0-9.-]{0,240}\.html$/.test(product.slug)) throw new Error("CATALOG_PRODUCT_INVALID");
  const images = [...new Set([product.image, ...(product.images || [])].filter(Boolean))].map(mediaUrl);
  if (!images.length || images.length > 30) throw new Error("CATALOG_IMAGES_INVALID");
  const specs = product.specs || [];
  if (specs.some(spec => !spec.label.trim() || !spec.value.trim())) throw new Error("CATALOG_SPECS_INVALID");
  await database.transaction(async connection => {
    const saved = await connection.query(`
      INSERT INTO nari_catalog.products (id,sku,slug,name,english_name,brand_id,category_id,price,market_price,description,overview_html,ingredients_html,usage_html)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, english_name=EXCLUDED.english_name,
      brand_id=EXCLUDED.brand_id, category_id=EXCLUDED.category_id, price=EXCLUDED.price, market_price=EXCLUDED.market_price,
      description=EXCLUDED.description, overview_html=EXCLUDED.overview_html, ingredients_html=EXCLUDED.ingredients_html,
      usage_html=EXCLUDED.usage_html, updated_at=clock_timestamp()
      WHERE products.sku=EXCLUDED.sku AND products.slug=EXCLUDED.slug AND products.updated_at=$14::timestamptz
      RETURNING id`, [product.id,product.sku,product.slug,product.name,product.englishName || null,references.brandId,references.categoryId,
      price,old,product.description || "",product.overviewHtml || "",product.ingredientsHtml || "",product.usageHtml || "",references.expectedUpdatedAt || null]);
    if (saved.rows.length !== 1) throw new Error("CATALOG_EDIT_CONFLICT");
    await connection.query("DELETE FROM nari_catalog.product_images WHERE product_id=$1", [product.id]);
    for (const [position,url] of images.entries()) {
      await connection.query("INSERT INTO nari_catalog.product_images (id,product_id,url,sort_order) VALUES ($1,$2,$3,$4)", [`${product.id}:image:${position}`,product.id,url,position]);
    }
    await connection.query("DELETE FROM nari_catalog.product_specs WHERE product_id=$1", [product.id]);
    for (const [position,spec] of specs.entries()) {
      await connection.query("INSERT INTO nari_catalog.product_specs (product_id,sort_order,label,value) VALUES ($1,$2,$3,$4)", [product.id,position,spec.label,spec.value]);
    }
  });
}

/** Soft visibility change with optimistic locking; no product or media is deleted. */
export async function setPostgresProductHidden(
  connection: CatalogSqlConnection, id: string, hidden: boolean, expectedUpdatedAt: string,
): Promise<void> {
  const result = await connection.query(`UPDATE nari_catalog.products SET hidden_at=CASE WHEN $2 THEN clock_timestamp() ELSE NULL END,
    updated_at=clock_timestamp() WHERE id=$1 AND updated_at=$3::timestamptz RETURNING id`, [id,hidden,expectedUpdatedAt]);
  if (result.rows.length !== 1) throw new Error("CATALOG_EDIT_CONFLICT");
}

/** Full-list replacement; the API must communicate overwrite semantics explicitly. */
export async function replacePostgresBanners(database: CatalogSqlDatabase, banners: LiveCatalogOverridesState["banners"]): Promise<void> {
  const entries = [...banners.heroSlides.map((item,position) => ({...item,position,placement:"hero"})),
    ...banners.sideBanners.map((item,position) => ({...item,position,placement:"side"}))];
  if (entries.length > 40 || new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error("CATALOG_BANNERS_INVALID");
  for (const entry of entries) { if (!entry.id) throw new Error("CATALOG_BANNERS_INVALID"); mediaUrl(entry.src); mediaUrl(entry.href); }
  await database.transaction(async connection => {
    await connection.query("SELECT pg_advisory_xact_lock(hashtext('nari_catalog.home_banners'))");
    await connection.query("DELETE FROM nari_catalog.home_banners");
    for (const entry of entries) await connection.query(`INSERT INTO nari_catalog.home_banners
      (id,placement,sort_order,image_url,target_url,alt_text) VALUES ($1,$2,$3,$4,$5,$6)`,
    [entry.id,entry.placement,entry.position,entry.src,entry.href,entry.alt]);
  });
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("CATALOG_ROW_INVALID");
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string" && typeof value !== "bigint") throw new Error("CATALOG_INTEGER_INVALID");
  if (typeof value === "string" && !/^\d+$/.test(value)) throw new Error("CATALOG_INTEGER_INVALID");
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error("CATALOG_INTEGER_INVALID");
  return result;
}

function timestamp(value: unknown): string {
  const result = value instanceof Date ? value : new Date(text(value));
  if (!Number.isFinite(result.valueOf())) throw new Error("CATALOG_DATE_INVALID");
  // JSON timestamp strings preserve PostgreSQL microseconds for optimistic locking.
  return typeof value === "string" ? value : result.toISOString();
}

/** Read through one SQL statement so all product/media/banner rows share one MVCC snapshot.
 * Public reads publish merchant-authored rows (no imported source) or merchant-verified
 * imports only. Observed/unverified snapshots and demo references remain admin-only.
 */
export async function readPostgresCatalog(connection: CatalogSqlConnection, includeHidden = false): Promise<LiveCatalogOverridesState> {
  const result = await connection.query(`
    SELECT kind, data FROM (SELECT 'product' AS kind, to_jsonb(p) || jsonb_build_object(
      'brand', b.name, 'category', c.slug,
      'images', COALESCE((SELECT jsonb_agg(i.url ORDER BY i.sort_order) FROM nari_catalog.product_images i
        LEFT JOIN nari_catalog.sources ims ON ims.id = i.source_id
        WHERE i.product_id = p.id AND ($1::boolean OR i.source_id IS NULL OR ims.verification_state = 'merchant')), '[]'::jsonb),
      'specs', COALESCE((SELECT jsonb_agg(jsonb_build_object('label', s.label, 'value', s.value) ORDER BY s.sort_order) FROM nari_catalog.product_specs s WHERE s.product_id = p.id), '[]'::jsonb)
    ) AS data
    FROM nari_catalog.products p
    JOIN nari_catalog.brands b ON b.id = p.brand_id
    JOIN nari_catalog.categories c ON c.id = p.category_id
    LEFT JOIN nari_catalog.sources ps ON ps.id = p.source_id
    LEFT JOIN nari_catalog.sources bs ON bs.id = b.source_id
    LEFT JOIN nari_catalog.sources cs ON cs.id = c.source_id
    WHERE $1::boolean OR (NOT p.is_demo AND NOT b.is_demo AND NOT c.is_demo
      AND (p.source_id IS NULL OR ps.verification_state = 'merchant')
      AND (b.source_id IS NULL OR bs.verification_state = 'merchant')
      AND (c.source_id IS NULL OR cs.verification_state = 'merchant'))
    UNION ALL
    SELECT 'brand' AS kind, jsonb_build_object('id',b.id,'slug',b.slug,'label',b.name) AS data
    FROM nari_catalog.brands b LEFT JOIN nari_catalog.sources s ON s.id=b.source_id
    WHERE $1::boolean OR (NOT b.is_demo AND (b.source_id IS NULL OR s.verification_state='merchant'))
    UNION ALL
    SELECT 'category' AS kind, jsonb_build_object('id',c.id,'slug',c.slug,'label',c.name,'parentId',c.parent_id) AS data
    FROM nari_catalog.categories c LEFT JOIN nari_catalog.sources s ON s.id=c.source_id
    WHERE $1::boolean OR (NOT c.is_demo AND (c.source_id IS NULL OR s.verification_state='merchant'))
    UNION ALL
    SELECT 'banner' AS kind, to_jsonb(h) AS data FROM nari_catalog.home_banners h
    LEFT JOIN nari_catalog.sources hs ON hs.id = h.source_id
    WHERE h.is_active AND ($1::boolean OR h.source_id IS NULL OR hs.verification_state = 'merchant')) catalog_rows
    ORDER BY kind, data->>'id'
  `, [includeHidden]);
  const state: LiveCatalogOverridesState = { source: "postgres", references: { brands: [], categories: [] }, updatedAt: "", deletedSlugs: [], products: {}, banners: { heroSlides: [], sideBanners: [] } };
  const bannerRows: Record<string, unknown>[] = [];
  for (const row of result.rows) {
    if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) throw new Error("CATALOG_ROW_INVALID");
    const data = row.data as Record<string, unknown>;
    if (row.kind === "brand" || row.kind === "category") {
      const reference = { id: text(data.id), slug: text(data.slug), label: text(data.label), ...(typeof data.parentId === "string" ? { parentId: data.parentId } : {}) };
      state.references![row.kind === "brand" ? "brands" : "categories"].push(reference);
      continue;
    }
    const updatedAt = timestamp(data.updated_at);
    if (updatedAt > state.updatedAt) state.updatedAt = updatedAt;
    if (row.kind === "banner") { bannerRows.push(data); continue; }
    if (row.kind !== "product") throw new Error("CATALOG_ROW_INVALID");
    const slug = text(data.slug);
    if (data.hidden_at !== null) { state.deletedSlugs.push(slug); if (!includeHidden) continue; }
    if (!Array.isArray(data.images) || data.images.some((url) => typeof url !== "string") || !Array.isArray(data.specs)) throw new Error("CATALOG_ROW_INVALID");
    const price = integer(data.price);
    const old = integer(data.market_price);
    if (old < price) throw new Error("CATALOG_PRICE_INVALID");
    const product: LiveProductOverride = {
      catalogSource: "postgres",
      brandId: text(data.brand_id), categoryId: text(data.category_id),
      id: text(data.id), sku: text(data.sku), slug, name: text(data.name),
      englishName: data.english_name === null ? undefined : text(data.english_name),
      brand: text(data.brand), category: text(data.category), price, old,
      sale: old > 0 ? Math.round((old - price) / old * 100) : 0,
      image: data.images[0] || "", images: data.images as string[],
      description: text(data.description), overviewHtml: text(data.overview_html),
      ingredientsHtml: text(data.ingredients_html), usageHtml: text(data.usage_html),
      specs: data.specs.map((spec: unknown) => {
        if (!spec || typeof spec !== "object") throw new Error("CATALOG_ROW_INVALID");
        const entry = spec as Record<string, unknown>;
        return { label: text(entry.label), value: text(entry.value) };
      }), updatedAt,
    };
    if (data.observed_rating !== null) {
      const rating = Number(data.observed_rating);
      if (!Number.isFinite(rating) || rating < 0 || rating > 5) throw new Error("CATALOG_RATING_INVALID");
      product.rating = rating;
    }
    if (data.observed_review_count !== null) product.reviewCount = integer(data.observed_review_count);
    if (data.observed_sold_count !== null) product.sold = integer(data.observed_sold_count);
    state.products[slug] = includeHidden ? { ...product, brandId: text(data.brand_id), categoryId: text(data.category_id), isDeleted: data.hidden_at !== null } as ManagedCatalogProduct : product;
  }
  bannerRows.sort((a, b) => integer(a.sort_order) - integer(b.sort_order));
  for (const data of bannerRows) {
    if (data.placement !== "hero" && data.placement !== "side") throw new Error("CATALOG_BANNER_INVALID");
    const key = data.placement === "hero" ? "heroSlides" : "sideBanners";
    state.banners[key].push({ id: text(data.id), src: text(data.image_url), href: text(data.target_url), alt: text(data.alt_text) });
  }
  return state;
}

/** Public DTO strips all hidden contents while retaining tombstones against legacy snapshots. */
export async function readPostgresStorefrontCatalog(connection: CatalogSqlConnection): Promise<LiveCatalogOverridesState> {
  return readPostgresCatalog(connection);
}
