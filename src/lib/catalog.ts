import { getStaticCatalogOverrides, type LiveProductOverride, type LiveCatalogOverridesState } from "@/lib/live-catalog";

export const categories = [
  ["Chăm Sóc Da Mặt", "cham-soc-da-mat-c4.html"],
  ["Trang Điểm", "trang-diem-c23.html"],
  ["Chăm Sóc Cơ Thể", "cham-soc-co-the-c12.html"],
  ["Làm Sạch Da", "lam-sach-da-c1855.html"],
  ["Thời Trang", "thoi-trang-c2351.html"],
  ["Chăm Sóc Tóc Và Da Đầu", "cham-soc-toc-c96.html"],
  ["Chăm Sóc Cá Nhân", "cham-soc-ca-nhan-c2049.html"],
  ["Thời Trang Nam", "thoi-trang-nam-c2359.html"],
  ["Chống Nắng Da Mặt", "chong-nang-da-mat-c11.html"],
  ["Thời Trang Nữ", "thoi-trang-nu-c2355.html"],
  ["Nước Hoa", "nuoc-hoa-c103.html"],
  ["Chăm Sóc Răng Miệng", "cham-soc-rang-mieng-c323.html"],
  ["Sản Phẩm Cao Cấp", "my-pham-high-end-c1907.html"],
  ["Thực Phẩm Chức Năng", "thuc-pham-chuc-nang-c156.html"],
  ["Chăm Sóc Phụ Nữ", "ve-sinh-phu-nu-c1901.html"],
  ["Thời Trang Trẻ Em", "thoi-trang-tre-em-c2363.html"],
  ["Nhà Cửa & Đời Sống", "gia-dung-doi-song-c2440.html"],
  ["Sản Phẩm Cho Bé", "san-pham-cho-be-c2497.html"],
  ["Sữa Rửa Mặt", "sua-rua-mat-c19.html"],
  ["Tẩy Trang Mặt", "tay-trang-mat-c48.html"],
  ["Kem / Gel / Dầu Dưỡng", "kem-duong-dau-duong-c9.html"],
  ["Serum / Tinh Chất", "serum-tinh-chat-c75.html"],
  ["Mặt Nạ Giấy", "mat-na-giay-c31.html"],
  ["Toner / Nước Cân Bằng Da", "toner-c1857.html"],
  ["Bông Tẩy Trang", "khan-bong-tay-trang-c47.html"],
  ["Dầu Gội", "dau-goi-c97.html"],
  ["Bộ Gội Xả", "bo-goi-xa-c2152.html"],
  ["Son Kem / Tint", "son-kem-tint-c49.html"],
  ["Phụ Kiện Điện Thoại", "phu-kien-dien-thoai-c2474.html"],
  ["DermaHair", "dermahair-c2298.html"],
  ["Tẩy Tế Bào Chết Da Mặt", "tay-te-bao-chet-da-mat-c35.html"],
  ["Củ Sạc & Cáp Sạc", "cap-sac-c2693.html"],
  ["Thiết Bị Âm Thanh", "thiet-bi-am-thanh-c2930.html"],
  ["Vệ Sinh Nhà Cửa", "ve-sinh-nha-cua-c2462.html"],
  ["Balo & Túi Xách", "balo-tui-xach-c2749.html"],
  ["Sức Khỏe - Làm Đẹp", "suc-khoe-lam-dep-c3.html"],
] as const;

export interface Product {
  catalogSource?: "postgres";
  englishName?: string;
  brandId?: string;
  categoryId?: string;
  id?: number | string;
  sku?: string;
  brand: string;
  name: string;
  price: number;
  old: number;
  sale: number;
  slug: string;
  category: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  description?: string;
  isSample?: boolean;
}

export function productBreadcrumbs(product: Product) {
  const facial = [
    "sua-rua-mat-c19.html",
    "tay-trang-mat-c48.html",
    "toner-c1857.html",
    "chong-nang-da-mat-c11.html",
    "tay-te-bao-chet-da-mat-c35.html",
    "kem-duong-dau-duong-c9.html",
    "serum-tinh-chat-c75.html",
    "mat-na-giay-c31.html",
  ];
  const cleaning = ["sua-rua-mat-c19.html", "tay-trang-mat-c48.html", "tay-te-bao-chet-da-mat-c35.html"];
  const path =
    product.category === "phu-kien-dien-thoai-c2474.html" || product.category === "cap-sac-c2693.html"
      ? ["gia-dung-doi-song-c2440.html", product.category]
      : facial.includes(product.category)
        ? [
            "cham-soc-da-mat-c4.html",
            ...(cleaning.includes(product.category) ? ["lam-sach-da-c1855.html"] : []),
            product.category,
          ]
        : [product.category];
  return path.flatMap((slug) => {
    const category = categories.find((item) => item[1] === slug);
    return category ? [category] : [];
  });
}

function mapOverrideToProduct(ov: LiveProductOverride, source?: "postgres"): Product {
  return {
    catalogSource: ov.catalogSource ?? source,
    id: ov.id || ov.sku,
    sku: ov.sku,
    slug: ov.slug,
    name: ov.name,
    englishName: ov.englishName,
    brand: ov.brand,
    brandId: ov.brandId,
    categoryId: ov.categoryId,
    category: ov.category,
    price: ov.price,
    old: ov.old,
    sale: ov.sale,
    image: ov.image,
    rating: ov.rating,
    reviewCount: ov.reviewCount,
    sold: ov.sold,
    description: ov.description,
  };
}

export function getFeaturedProducts(live: LiveCatalogOverridesState = getStaticCatalogOverrides()): Product[] {
  const deleted = new Set(live.deletedSlugs);
  return Object.values(live.products)
    .filter((ov) => Boolean(ov.slug) && !deleted.has(ov.slug))
    .map((ov) => mapOverrideToProduct(ov, live.source));
}

export const products: readonly Product[] = getFeaturedProducts();

export const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";

const CATEGORY_FALLBACK_MAP: Record<string, string> = {
  "son-duong-moi": "son-kem-tint-c49.html",
  "kem-gel-dau-duong": "kem-duong-dau-duong-c9.html",
  "camera-giam-sat": "phu-kien-dien-thoai-c2474.html",
  "dien-thoai-may-tinh-bang": "phu-kien-dien-thoai-c2474.html",
  "dien-tu-phu-kien": "phu-kien-dien-thoai-c2474.html",
  "loa-bluetooth": "thiet-bi-am-thanh-c2930.html",
  "dung-cu-so-che-thuc-pham": "ve-sinh-nha-cua-c2462.html",
  "dien-lanh-dien-may": "ve-sinh-nha-cua-c2462.html",
  "dien-gia-dung": "ve-sinh-nha-cua-c2462.html",
  "nha-cua-doi-song": "gia-dung-doi-song-c2440.html",
  "pin-tieu": "ve-sinh-nha-cua-c2462.html",
  "kem-duong-am-cho-be": "san-pham-cho-be-c2497.html",
  "ao-nu": "balo-tui-xach-c2749.html",
  "vo": "balo-tui-xach-c2749.html",
  "my-pham": "cham-soc-da-mat-c4.html",
};

const uiCategoryTitleMap = new Map<string, string>();
const uiCategoryParentMap = new Map<string, string>();

(() => {
  for (const [title, slug] of categories) {
    uiCategoryTitleMap.set(slug, title);
    uiCategoryTitleMap.set(slug.replace(/\.html$/i, ""), title);
  }
  uiCategoryTitleMap.set("nha-cua-doi-song-c2529.html", "Nhà Cửa - Đời Sống");
  uiCategoryTitleMap.set("dien-gia-dung-c2463.html", "Điện Gia Dụng");
  uiCategoryTitleMap.set("loa-bluetooth-c2800.html", "Loa Bluetooth");
  uiCategoryTitleMap.set("my-pham-c3.html", "Mỹ Phẩm");
  uiCategoryTitleMap.set("camera-giam-sat-c2934.html", "Camera Giám Sát");
  uiCategoryTitleMap.set("dung-cu-so-che-thuc-pham-c2809.html", "Dụng Cụ Sơ Chế Thực Phẩm");
  uiCategoryTitleMap.set("kem-duong-am-cho-be-c2505.html", "Kem Dưỡng Ẩm Cho Bé");
  uiCategoryTitleMap.set("pin-tieu-c2733.html", "Pin Tiểu");
  uiCategoryTitleMap.set("ao-nu-c2593.html", "Áo Nữ");
  uiCategoryTitleMap.set("vo-c2856.html", "Vớ");
  uiCategoryTitleMap.set("dac-tri-c1865.html", "Chăm Sóc Chuyên Sâu");
  uiCategoryTitleMap.set("duong-am-da-c1863.html", "Dưỡng Ẩm");
  uiCategoryTitleMap.set("dien-lanh-dien-may-c2981.html", "Điện Lạnh & Điện Máy");
  uiCategoryTitleMap.set("dien-gia-dung-c2761.html", "Điện Gia Dụng");
  uiCategoryTitleMap.set("dien-thoai-may-tinh-bang-c2926.html", "Điện Thoại & Máy Tính Bảng");
  uiCategoryTitleMap.set("dien-tu-phu-kien-c2673.html", "Thiết Bị Điện Tử");
})();

export function getCategoryTitle(slug: string): string {
  const direct =
    uiCategoryTitleMap.get(slug) ||
    uiCategoryTitleMap.get(slug.replace(/\.html$/i, "")) ||
    uiCategoryTitleMap.get(`${slug.replace(/\.html$/i, "")}.html`);
  if (direct) return direct;
  const base = slug.replace(/-c\d+(?:\.html)?$/i, "").replace(/\.html$/i, "");
  for (const [title, catSlug] of categories) {
    const catBase = catSlug.replace(/-c\d+(?:\.html)?$/i, "").replace(/\.html$/i, "");
    if (catBase === base) return title;
  }
  return base
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveCategorySlug(inputSlug: string): string {
  if (categories.some(([, s]) => s === inputSlug)) {
    return inputSlug;
  }
  const withHtml = inputSlug.endsWith(".html") ? inputSlug : `${inputSlug}.html`;
  if (categories.some(([, s]) => s === withHtml)) {
    return withHtml;
  }
  const base = inputSlug.replace(/-c\d+(?:\.html)?$/i, "").replace(/\.html$/i, "");
  if (CATEGORY_FALLBACK_MAP[base]) {
    return CATEGORY_FALLBACK_MAP[base];
  }
  const match = categories.find(([, catSlug]) => {
    const catBase = catSlug.replace(/-c\d+(?:\.html)?$/i, "").replace(/\.html$/i, "");
    return catBase === base || catSlug.startsWith(base) || base.startsWith(catBase);
  });
  if (match) {
    return match[1];
  }
  for (const [prefix, target] of Object.entries(CATEGORY_FALLBACK_MAP)) {
    if (base.includes(prefix)) {
      return target;
    }
  }
  const parentRoot = uiCategoryParentMap.get(inputSlug) || uiCategoryParentMap.get(withHtml);
  if (parentRoot) {
    const resolvedParent = resolveCategorySlug(parentRoot);
    if (resolvedParent) return resolvedParent;
  }
  if (uiCategoryTitleMap.has(inputSlug) || uiCategoryTitleMap.has(withHtml) || /-c\d+(?:\.html)?$/i.test(inputSlug)) {
    return "cham-soc-da-mat-c4.html";
  }
  return "";
}

export function categoryProducts(slug: string, live: LiveCatalogOverridesState = getStaticCatalogOverrides()): Product[] {
  const currentProducts = getFeaturedProducts(live);
  if (currentProducts.length === 0) return [];

  if (live.source === "postgres" && live.references?.categories?.length) {
    const references = live.references.categories;
    const root = references.find((category) => category.slug === slug);
    if (!root) return [];
    const ids = new Set([root.id]);
    for (;;) {
      const before = ids.size;
      for (const category of references) {
        if (category.parentId && ids.has(category.parentId)) ids.add(category.id);
      }
      if (before === ids.size) break;
    }
    const slugs = new Set(references.filter((category) => ids.has(category.id)).map((category) => category.slug));
    return currentProducts.filter((product) => slugs.has(product.category));
  }

  const resolved = categories.some(([, s]) => s === slug) ? slug : resolveCategorySlug(slug) || slug;
  const facial = [
    "sua-rua-mat-c19.html",
    "tay-trang-mat-c48.html",
    "toner-c1857.html",
    "chong-nang-da-mat-c11.html",
    "tay-te-bao-chet-da-mat-c35.html",
    "kem-duong-dau-duong-c9.html",
    "serum-tinh-chat-c75.html",
    "mat-na-giay-c31.html",
  ];
  if (resolved === "cham-soc-da-mat-c4.html") {
    return currentProducts.filter((p) => facial.includes(p.category) || p.category === resolved);
  }
  if (resolved === "lam-sach-da-c1855.html") {
    return currentProducts.filter((p) => ["sua-rua-mat-c19.html", "tay-trang-mat-c48.html", resolved].includes(p.category));
  }
  return currentProducts.filter((p) => p.category === resolved || p.category === slug);
}

/**
 * Returns all unique products derived exclusively from the live catalog state.
 */
export function getAllCatalogProducts(live: LiveCatalogOverridesState = getStaticCatalogOverrides()): Product[] {
  return getFeaturedProducts(live);
}

export function findCatalogProduct(slug: string, live: LiveCatalogOverridesState = getStaticCatalogOverrides()): Product | undefined {
  const all = getAllCatalogProducts(live);
  const exact = all.find((item) => item.slug === slug || item.slug === `${slug}.html`);
  if (exact) {
    return exact;
  }
  const norm = (s: string) => s.replace(/(?:-\d+)?\.html$/i, "").replace(/-\d+$/i, "").toLowerCase();
  const target = norm(slug);
  return all.find((item) => norm(item.slug) === target);
}
