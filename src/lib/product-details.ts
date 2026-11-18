import type {
  ProductDetailData,
  ProductRatingSummary,
  ProductCommentItem,
  ProductSummary,
  BrandSummary,
} from "@/lib/backend-contracts";
import { BRAND_CONFIG } from "@/lib/brand-config";
import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";

// Admin-authored rich text is displayed as text until a maintained sanitizer is configured.
function escapeCatalogText(value: string | undefined): string | undefined {
  return value?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function normalizeBrandKey(input: string): string {
  return input.replace(/\.html$/i, "").trim().toLowerCase();
}

function slugifyBrand(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes slug or id key into rich product details strictly from live catalog state.
 */
export function getRichProductDetail(
  slugOrId: string,
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductDetailData | null {
  if (!slugOrId) return null;
  const deleted = new Set(live.deletedSlugs);
  if (deleted.has(slugOrId)) return null;

  const liveOverride =
    live.products[slugOrId] ||
    live.products[`${slugOrId}.html`] ||
    Object.values(live.products).find(
      (p) =>
        p.sku === slugOrId ||
        String(p.id || "") === slugOrId ||
        p.slug.endsWith(`-${slugOrId}.html`)
    );

  if (!liveOverride || deleted.has(liveOverride.slug)) {
    return null;
  }

  const imgs =
    liveOverride.images && liveOverride.images.length > 0
      ? liveOverride.images
      : liveOverride.image
        ? [liveOverride.image]
        : [];

  return {
    id: liveOverride.id || liveOverride.sku,
    sku: liveOverride.sku,
    slug: liveOverride.slug,
    name: liveOverride.name,
    englishName: liveOverride.englishName,
    brand: liveOverride.brand,
    category: liveOverride.category,
    price: liveOverride.price,
    old: liveOverride.old,
    sale: liveOverride.sale,
    image: liveOverride.image || imgs[0],
    images: imgs,
    rating: liveOverride.rating,
    reviewCount: liveOverride.reviewCount,
    sold: liveOverride.sold,
    description: liveOverride.description,
    overviewHtml: escapeCatalogText(liveOverride.overviewHtml || liveOverride.description),
    ingredientsText: escapeCatalogText(liveOverride.ingredientsHtml),
    usageText: escapeCatalogText(liveOverride.usageHtml),
    specs:
      liveOverride.specs && liveOverride.specs.length > 0
        ? liveOverride.specs
        : [
            { label: "Thương Hiệu", value: liveOverride.brand },
            { label: "Danh Mục", value: liveOverride.category },
            { label: "Mã Sản Phẩm (SKU)", value: liveOverride.sku },
          ],
    isSample: false,
    sourceUrl: `https://${BRAND_CONFIG.domain}/san-pham/${liveOverride.slug}`,
  };
}

/**
 * Returns rating summary for product, including star breakdown and reviews.
 */
export function getProductReviews(
  slugOrId: string,
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductRatingSummary | null {
  const detail = getRichProductDetail(slugOrId, live);
  return detail?.ratingSummary ?? null;
}

/**
 * Returns customer comments and Q&A replies for product.
 */
export function getProductComments(
  slugOrId: string,
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductCommentItem[] {
  const detail = getRichProductDetail(slugOrId, live);
  return detail?.comments ?? [];
}

/**
 * Returns a dictionary of brand metadata and product counts derived from live catalog state.
 */
export function getBrandEnhancements(
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): Record<string, { logo: string; productCount: number; cover?: string; name: string }> {
  const result: Record<string, { logo: string; productCount: number; cover?: string; name: string }> = {};
  const deleted = new Set(live.deletedSlugs);
  const countsByBrand = new Map<string, number>();

  for (const prod of Object.values(live.products)) {
    if (!prod.slug || deleted.has(prod.slug) || !prod.brand) continue;
    const key = prod.brand.trim().toLowerCase();
    countsByBrand.set(key, (countsByBrand.get(key) || 0) + 1);
  }

  for (const ref of live.references?.brands || []) {
    const labelKey = ref.label.trim().toLowerCase();
    const slugKey = normalizeBrandKey(ref.slug);
    const count = countsByBrand.get(labelKey) || 0;
    const entry = {
      logo: "",
      productCount: count,
      name: ref.label,
    };
    result[labelKey] = entry;
    if (slugKey) result[slugKey] = entry;
    if (ref.slug) result[ref.slug.toLowerCase()] = entry;
  }

  return result;
}

/**
 * Returns brand metadata derived strictly from live references and live products.
 */
export function getBrandMetadata(
  slug: string,
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): BrandSummary | null {
  if (!slug) return null;
  const cleanSlug = slug.endsWith(".html") ? slug : `${slug}.html`;
  const baseKey = normalizeBrandKey(slug);
  const deleted = new Set(live.deletedSlugs);

  const brandRefs = live.references?.brands || [];
  const matchedRef = brandRefs.find(
    (b) =>
      b.slug.toLowerCase() === cleanSlug.toLowerCase() ||
      normalizeBrandKey(b.slug) === baseKey ||
      b.label.trim().toLowerCase() === baseKey ||
      slugifyBrand(b.label) === baseKey
  );

  if (matchedRef) {
    const productCount = Object.values(live.products).filter(
      (p) =>
        p.slug &&
        !deleted.has(p.slug) &&
        (p.brandId === matchedRef.id || p.brand.trim().toLowerCase() === matchedRef.label.trim().toLowerCase())
    ).length;

    return {
      id: matchedRef.id,
      name: matchedRef.label,
      slug: matchedRef.slug.endsWith(".html") ? matchedRef.slug : `${matchedRef.slug}.html`,
      url: `/thuong-hieu/${matchedRef.slug.endsWith(".html") ? matchedRef.slug : `${matchedRef.slug}.html`}`,
      productCount,
    };
  }

  return null;
}

/**
 * Returns live products matching a given brand name or slug.
 */
export function getBrandProductsSnapshot(
  brandNameOrSlug: string,
  live: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductSummary[] {
  if (!brandNameOrSlug) return [];
  const cleanKey = normalizeBrandKey(brandNameOrSlug);
  const deleted = new Set(live.deletedSlugs);
  const matchedRef = (live.references?.brands || []).find(
    (b) =>
      normalizeBrandKey(b.slug) === cleanKey ||
      b.label.trim().toLowerCase() === cleanKey ||
      slugifyBrand(b.label) === cleanKey
  );

  return Object.values(live.products)
    .filter((p) => {
      if (!p.slug || deleted.has(p.slug)) return false;
      if (matchedRef && (p.brandId === matchedRef.id || p.brand.trim().toLowerCase() === matchedRef.label.trim().toLowerCase())) {
        return true;
      }
      return p.brand.trim().toLowerCase() === cleanKey || slugifyBrand(p.brand) === cleanKey;
    })
    .map((p) => ({
      id: p.id || p.sku,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      old: p.old,
      sale: p.sale,
      image: p.image,
      rating: p.rating,
      reviewCount: p.reviewCount,
      sold: p.sold,
      description: p.description,
      isSample: false,
    }));
}
