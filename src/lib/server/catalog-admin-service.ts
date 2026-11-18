import "server-only";
import { randomUUID } from "node:crypto";
import type { LiveBannerItem, LiveCatalogOverridesState, ManagedCatalogProduct } from "@/lib/live-catalog";
import { createPostgresCatalogReference, readPostgresCatalog, type CatalogSqlDatabase } from "@/lib/server/postgres-catalog-repository";
import { createPostgresCatalogService } from "@/lib/server/postgres-catalog-service";

export class CatalogInputError extends Error {
  constructor(public code: string, public status = 400) { super(code); }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CatalogInputError("INVALID_INPUT");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, required = false): string {
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.length > max || (required && !value.trim())) throw new CatalogInputError("INVALID_INPUT");
  return value.trim();
}
function money(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new CatalogInputError("INVALID_PRICE");
  return value;
}
function version(value: unknown): string {
  const result = text(value, 64, true);
  if (!/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(result) || !Number.isFinite(Date.parse(result))) throw new CatalogInputError("INVALID_VERSION");
  return result;
}
function slugFor(name: string, sku: string) {
  const namePart = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
  return `${namePart || "san-pham"}-${sku.toLowerCase().replace(/[^a-z0-9]+/g, "")}.html`;
}

export function createCatalogAdminService(database: CatalogSqlDatabase) {
  const service = createPostgresCatalogService(database);
  async function read() {
    const state = await readPostgresCatalog(database, true);
    const brands = await database.query("SELECT id, name AS label, slug FROM nari_catalog.brands ORDER BY name, id");
    const categories = await database.query("SELECT id, name AS label, slug FROM nari_catalog.categories ORDER BY display_order, name, id");
    return { products: Object.values(state.products) as ManagedCatalogProduct[], brands: brands.rows, categories: categories.rows, banners: state.banners, deletedSlugs: state.deletedSlugs, updatedAt: state.updatedAt };
  }
  return {
    read,
    async mutate(input: unknown) {
      const body = object(input);
      const action = text(body.action, 40, true);
      if (action === "create_brand" || action === "create_category") {
        const allowed = action === "create_brand" ? ["action", "label", "slug"] : ["action", "label", "slug", "parentId"];
        if (Object.keys(body).some(key => !allowed.includes(key))) throw new CatalogInputError("INVALID_REFERENCE_FIELDS");
        const label = text(body.label, 200, true);
        const slug = text(body.slug, 125, true);
        if (!/^[a-z0-9][a-z0-9-]{0,119}(?:\.html)?$/.test(slug)) throw new CatalogInputError("INVALID_REFERENCE_SLUG");
        const parentId = action === "create_category" ? text(body.parentId, 120) : "";
        const result = await createPostgresCatalogReference(database, { kind: action === "create_brand" ? "brand" : "category", id: randomUUID(), label, slug, parentId });
        if (result.rows.length !== 1) throw new Error("CATALOG_REFERENCE_NOT_SAVED");
        return { reference: result.rows[0] };
      }
      if (action === "update_banners") {
        const banners = {} as LiveCatalogOverridesState["banners"];
        for (const key of ["heroSlides", "sideBanners"] as const) {
          const entries = body[key];
          if (!Array.isArray(entries) || entries.length > 40) throw new CatalogInputError("INVALID_BANNERS");
          banners[key] = entries.map(value => { const item = object(value); return {
            id: text(item.id, 120, true), src: text(item.src, 2048, true), href: text(item.href, 2048, true), alt: text(item.alt, 500),
          } satisfies LiveBannerItem; });
        }
        await service.replaceBanners(banners);
        return { banners: (await read()).banners };
      }
      if (!["upsert_product", "delete_product", "restore_product"].includes(action)) throw new CatalogInputError("UNKNOWN_ACTION");
      const state = await read();
      const id = text(body.id, 120);
      const existing = id ? state.products.find(product => product.id === id) : undefined;
      if (id && !existing) throw new CatalogInputError("CATALOG_EDIT_CONFLICT", 409);
      if (action !== "upsert_product") {
        if (!existing) throw new CatalogInputError("PRODUCT_REQUIRED");
        await service.setHidden(id, action === "delete_product", version(body.expectedUpdatedAt));
        return { deletedSlugs: (await read()).deletedSlugs };
      }
      if (body.initialStock !== undefined || body.rating !== undefined || body.reviewCount !== undefined || body.sold !== undefined) throw new CatalogInputError("UNSUPPORTED_PRODUCT_FIELDS");
      const name = text(body.name, 300, true);
      const sku = text(body.sku, 80, true);
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(sku)) throw new CatalogInputError("INVALID_SKU");
      const slug = text(body.slug, 246) || slugFor(name, sku);
      if (existing && (sku !== existing.sku || slug !== existing.slug)) throw new CatalogInputError("IMMUTABLE_PRODUCT_IDENTITY", 409);
      if (!existing && body.expectedUpdatedAt) throw new CatalogInputError("CATALOG_EDIT_CONFLICT", 409);
      const brandId = text(body.brandId, 120, true);
      const categoryId = text(body.categoryId, 120, true);
      const brand = state.brands.find(row => row.id === brandId);
      const category = state.categories.find(row => row.id === categoryId);
      if (!brand || !category) throw new CatalogInputError("INVALID_REFERENCE");
      const price = money(body.price);
      const old = money(body.old);
      if (old < price) throw new CatalogInputError("INVALID_PRICE");
      if (!Array.isArray(body.images) || body.images.length > 30 || !Array.isArray(body.specs) || body.specs.length > 100) throw new CatalogInputError("INVALID_MEDIA_OR_SPECS");
      const product: ManagedCatalogProduct = {
        id: existing?.id || randomUUID(), sku, slug, name, brandId, categoryId, brand: String(brand.label), category: String(category.slug),
        price, old, sale: old ? Math.round((old - price) / old * 100) : 0,
        image: text(body.image, 2048, true), images: body.images.map(value => text(value, 2048, true)),
        englishName: text(body.englishName, 300), description: text(body.description, 20000),
        overviewHtml: text(body.overviewHtml, 100000), ingredientsHtml: text(body.ingredientsHtml, 100000), usageHtml: text(body.usageHtml, 100000),
        specs: body.specs.map(value => { const spec = object(value); return { label: text(spec.label, 300, true), value: text(spec.value, 2000, true) }; }),
        updatedAt: "", isDeleted: existing?.isDeleted || false,
      };
      await service.upsert(product, { brandId, categoryId, expectedUpdatedAt: existing ? version(body.expectedUpdatedAt) : undefined });
      return { product: (await read()).products.find(row => row.id === product.id) };
    },
  };
}
