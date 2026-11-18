/**
 * Central Deals & Bestsellers Service Module for Nari Home.
 * Operates strictly on LiveCatalogOverridesState (returning [] when empty).
 */

import type { ProductSummary } from "@/lib/backend-contracts";
import { money } from "@/lib/catalog";
import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";

export interface DealProduct extends ProductSummary {
  deal?: {
    quantity: number;
    bought_percent: number;
    time_remain?: number;
  };
  progress?: number;
  category_id?: number | string;
}

export interface BestsellerProduct extends ProductSummary {
  rank: number;
  badge?: string;
  category_id?: number | string;
}

export interface DealCategoryOption {
  label: string;
  id: string;
  slug: string;
  count?: number;
}

// Canonical category mappings matching Nari Home navigation & catalog.ts
const CATEGORY_ID_TO_SLUG: Record<string, string> = {
  "": "",
  "4": "cham-soc-da-mat-c4.html",
  "11": "chong-nang-da-mat-c11.html",
  "12": "cham-soc-co-the-c12.html",
  "19": "sua-rua-mat-c19.html",
  "23": "trang-diem-c23.html",
  "31": "mat-na-giay-c31.html",
  "35": "tay-te-bao-chet-da-mat-c35.html",
  "47": "khan-bong-tay-trang-c47.html",
  "48": "tay-trang-mat-c48.html",
  "49": "son-kem-tint-c49.html",
  "75": "serum-tinh-chat-c75.html",
  "96": "cham-soc-toc-c96.html",
  "97": "dau-goi-c97.html",
  "103": "nuoc-hoa-c103.html",
  "156": "thuc-pham-chuc-nang-c156.html",
  "323": "cham-soc-rang-mieng-c323.html",
  "331": "nari-clinic-spa.html",
  "1855": "lam-sach-da-c1855.html",
  "1857": "toner-c1857.html",
  "1901": "ve-sinh-phu-nu-c1901.html",
  "1907": "my-pham-high-end-c1907.html",
  "2049": "cham-soc-ca-nhan-c2049.html",
  "2152": "bo-goi-xa-c2152.html",
  "2298": "dermahair-c2298.html",
  "2351": "thoi-trang-c2351.html",
  "2355": "thoi-trang-nu-c2355.html",
  "2359": "thoi-trang-nam-c2359.html",
  "2363": "thoi-trang-tre-em-c2363.html",
  "2440": "gia-dung-doi-song-c2440.html",
  "2462": "ve-sinh-nha-cua-c2462.html",
  "2474": "phu-kien-dien-thoai-c2474.html",
  "2497": "san-pham-cho-be-c2497.html",
  "2693": "cap-sac-c2693.html",
  "2749": "balo-tui-xach-c2749.html",
  "2930": "thiet-bi-am-thanh-c2930.html",
};

const FACIAL_SLUGS = [
  "cham-soc-da-mat-c4.html",
  "sua-rua-mat-c19.html",
  "tay-trang-mat-c48.html",
  "toner-c1857.html",
  "chong-nang-da-mat-c11.html",
  "serum-tinh-chat-c75.html",
  "mat-na-giay-c31.html",
  "kem-duong-dau-duong-c9.html",
  "tay-te-bao-chet-da-mat-c35.html",
];

const PERSONAL_CARE_SLUGS = [
  "cham-soc-ca-nhan-c2049.html",
  "khan-bong-tay-trang-c47.html",
  "cham-soc-rang-mieng-c323.html",
  "ve-sinh-phu-nu-c1901.html",
];

const HAIR_CARE_SLUGS = [
  "cham-soc-toc-c96.html",
  "dau-goi-c97.html",
  "bo-goi-xa-c2152.html",
];

const PHONE_ACCESSORIES_SLUGS = [
  "phu-kien-dien-thoai-c2474.html",
  "cap-sac-c2693.html",
];

const MAKEUP_SLUGS = [
  "trang-diem-c23.html",
  "son-kem-tint-c49.html",
];

/**
 * Normalizes category matching to handle hierarchy rollups.
 */
export function matchesCategory(
  productCategory: string,
  targetCategory: string | { id?: string; slug?: string }
): boolean {
  let targetSlug = typeof targetCategory === "string" ? targetCategory : targetCategory.slug || "";
  const targetId = typeof targetCategory === "string" ? "" : targetCategory.id || "";

  if (!targetSlug && targetId && CATEGORY_ID_TO_SLUG[targetId]) {
    targetSlug = CATEGORY_ID_TO_SLUG[targetId];
  }

  if (!targetSlug) return true;
  if (productCategory === targetSlug) return true;

  if (targetSlug === "cham-soc-da-mat-c4.html") {
    return FACIAL_SLUGS.includes(productCategory);
  }
  if (targetSlug === "lam-sach-da-c1855.html") {
    return ["sua-rua-mat-c19.html", "tay-trang-mat-c48.html"].includes(productCategory);
  }
  if (targetSlug === "cham-soc-ca-nhan-c2049.html") {
    return PERSONAL_CARE_SLUGS.includes(productCategory);
  }
  if (targetSlug === "cham-soc-toc-c96.html") {
    return HAIR_CARE_SLUGS.includes(productCategory);
  }
  if (targetSlug === "phu-kien-dien-thoai-c2474.html") {
    return PHONE_ACCESSORIES_SLUGS.includes(productCategory);
  }
  if (targetSlug === "trang-diem-c23.html") {
    return MAKEUP_SLUGS.includes(productCategory);
  }

  return false;
}

/**
 * Derives active Flash Deals strictly from live catalog state.
 */
export function getDealsSnapshot(
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): DealProduct[] {
  const deleted = new Set(liveCatalog.deletedSlugs);
  const items = Object.values(liveCatalog.products)
    .filter((p) => p.slug && !deleted.has(p.slug) && (p.sale > 0 || (p.old > 0 && p.old > p.price)))
    .sort((a, b) => (b.sale || 0) - (a.sale || 0))
    .map<DealProduct>((p) => ({
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

  return items;
}

/**
 * Returns category filter options with live Flash Deal counts.
 */
export function getDealCategories(
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): DealCategoryOption[] {
  const baseFilters: DealCategoryOption[] = [
    { label: "Tất cả", id: "", slug: "" },
    { label: "Chăm Sóc Cá Nhân", id: "2049", slug: "cham-soc-ca-nhan-c2049.html" },
    { label: "Chăm Sóc Cơ Thể", id: "12", slug: "cham-soc-co-the-c12.html" },
    { label: "Chăm Sóc Da Mặt", id: "4", slug: "cham-soc-da-mat-c4.html" },
    { label: "Chăm Sóc Tóc Và Da Đầu", id: "96", slug: "cham-soc-toc-c96.html" },
    { label: "Phụ Kiện Điện Thoại", id: "2474", slug: "phu-kien-dien-thoai-c2474.html" },
    { label: "Trang Điểm", id: "23", slug: "trang-diem-c23.html" },
    { label: "Nước Hoa", id: "103", slug: "nuoc-hoa-c103.html" },
    { label: "Balo & Túi Xách", id: "2749", slug: "balo-tui-xach-c2749.html" },
    { label: "Thiết Bị Âm Thanh", id: "2930", slug: "thiet-bi-am-thanh-c2930.html" },
    { label: "Vệ Sinh Nhà Cửa", id: "2462", slug: "ve-sinh-nha-cua-c2462.html" },
    { label: "Sản Phẩm Cho Bé", id: "2497", slug: "san-pham-cho-be-c2497.html" },
  ];

  const deals = getDealsSnapshot(liveCatalog);
  return baseFilters.map((filter) => {
    const count =
      filter.id === ""
        ? deals.length
        : deals.filter((d) => matchesCategory(d.category, filter)).length;
    return { ...filter, count };
  });
}

/**
 * Derives Bestseller rankings strictly from live catalog state.
 */
export function getBestsellersSnapshot(
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): BestsellerProduct[] {
  const deleted = new Set(liveCatalog.deletedSlugs);
  const sorted = Object.values(liveCatalog.products)
    .filter((p) => p.slug && !deleted.has(p.slug))
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0));

  return sorted.map((p, index) => ({
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
    rank: index + 1,
    badge: index < 3 ? `#${index + 1}` : undefined,
  }));
}

/**
 * Returns live category products for a given category slug.
 */
export function getScrapedCategoryProducts(
  categorySlug?: string,
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductSummary[] {
  const deleted = new Set(liveCatalog.deletedSlugs);
  return Object.values(liveCatalog.products)
    .filter((p) => {
      if (!p.slug || deleted.has(p.slug)) return false;
      return categorySlug ? matchesCategory(p.category, categorySlug) : true;
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

/**
 * Returns all live catalog products as ProductSummary[].
 */
export function getAllScrapedProducts(
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): ProductSummary[] {
  return getScrapedCategoryProducts(undefined, liveCatalog);
}

/**
 * Filters and sorts Flash Deals products.
 */
export function filterDealProducts(
  items: DealProduct[],
  options: {
    categoryId?: string;
    query?: string;
    brand?: string;
    sort?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
  } = {}
): DealProduct[] {
  const { categoryId = "", query = "", brand = "", sort = "topsale", minPrice = null, maxPrice = null } = options;

  const filtered = items.filter((product) => {
    if (categoryId && !matchesCategory(product.category, { id: categoryId })) {
      return false;
    }
    if (brand && product.brand.toLowerCase() !== brand.toLowerCase()) {
      return false;
    }
    if (query) {
      const q = query.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchBrand = product.brand.toLowerCase().includes(q);
      if (!matchName && !matchBrand) return false;
    }
    if (minPrice !== null && !isNaN(minPrice) && product.price < minPrice) {
      return false;
    }
    if (maxPrice !== null && !isNaN(maxPrice) && product.price > maxPrice) {
      return false;
    }
    return true;
  });

  if (sort === "low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "discount") {
    filtered.sort((a, b) => b.sale - a.sale);
  }

  return filtered;
}

/**
 * Filters and sorts Bestsellers products.
 */
export function filterBestsellerProducts(
  items: BestsellerProduct[],
  options: {
    brand?: string;
    category?: string;
    sort?: string;
    minPrice?: number | null;
    maxPrice?: number | null;
  } = {}
): BestsellerProduct[] {
  const { brand = "", category = "", sort = "topsale", minPrice = null, maxPrice = null } = options;

  const filtered = items.filter((product) => {
    if (brand && product.brand !== brand) {
      return false;
    }
    if (category && !matchesCategory(product.category, category)) {
      return false;
    }
    if (minPrice !== null && !isNaN(minPrice) && product.price < minPrice) {
      return false;
    }
    if (maxPrice !== null && !isNaN(maxPrice) && product.price > maxPrice) {
      return false;
    }
    return true;
  });

  if (sort === "low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sort === "high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sort === "topsale") {
    filtered.sort((a, b) => a.rank - b.rank);
  }

  return filtered;
}

export { money };
