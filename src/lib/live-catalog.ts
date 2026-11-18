/**
 * Shared catalog override contracts and empty defaults for snapshot-only consumers.
 * Server APIs read persisted overrides through server/live-catalog-store.
 * Calling this module alone does not subscribe a storefront to runtime changes.
 */


export interface LiveProductOverride {
  catalogSource?: "postgres";
  id?: string;
  sku: string;
  slug: string;
  name: string;
  englishName?: string;
  brand: string;
  brandId?: string;
  categoryId?: string;
  category: string;
  price: number;
  old: number;
  sale: number;
  image: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  sold?: number;
  description?: string;
  overviewHtml?: string;
  ingredientsHtml?: string;
  usageHtml?: string;
  specs?: Array<{ label: string; value: string }>;
  isCustom?: boolean;
  updatedAt: string;
}

export interface LiveBannerItem {
  id: string;
  src: string;
  alt: string;
  href: string;
}

/** Server-managed catalog DTO, including hidden products for restoration. */
export interface ManagedCatalogProduct extends LiveProductOverride {
  brandId: string;
  categoryId: string;
  isDeleted: boolean;
}

export interface LiveCatalogOverridesState {
  references?: { brands: LiveCatalogReference[]; categories: LiveCatalogReference[] };
  /** PostgreSQL is authoritative: absent rows must never fall back to snapshots. */
  source?: "postgres";
  updatedAt: string;
  deletedSlugs: string[];
  products: Record<string, LiveProductOverride>;
  banners: {
    heroSlides: LiveBannerItem[];
    sideBanners: LiveBannerItem[];
  };
}

export interface LiveCatalogReference {
  id: string;
  slug: string;
  label: string;
  parentId?: string;
}

export function getStaticCatalogOverrides(): LiveCatalogOverridesState {
  const data: Partial<LiveCatalogOverridesState> = {};
  return {
    updatedAt: data.updatedAt || "",
    deletedSlugs: Array.isArray(data.deletedSlugs) ? data.deletedSlugs : [],
    products: data.products && typeof data.products === "object" ? data.products : {},
    banners: {
      heroSlides: Array.isArray(data.banners?.heroSlides) ? data.banners!.heroSlides : [],
      sideBanners: Array.isArray(data.banners?.sideBanners) ? data.banners!.sideBanners : [],
    },
  };
}

/** Preserve snapshot membership/order while applying current catalog values and tombstones. */
export function applyCatalogOverrides<T extends { slug: string }>(
  items: readonly T[], state: LiveCatalogOverridesState = getStaticCatalogOverrides(),
): T[] {
  const deleted = new Set(state.deletedSlugs);
  return items.filter((item) => !deleted.has(item.slug) && (state.source !== "postgres" || Boolean(state.products[item.slug]))).map((item) => {
    const override = state.products[item.slug];
    return override ? { ...item, ...override } : item;
  });
}
