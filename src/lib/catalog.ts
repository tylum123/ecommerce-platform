import categoryProductsRaw from "../../docs/research/hasaki/category-products-2026-11-13.json";
import dealsRaw from "../../docs/research/hasaki/deals-2026-11-13.json";
import bestsellersRaw from "../../docs/research/hasaki/bestsellers-2026-11-13.json";
import brandCatalogRaw from "../../docs/research/hasaki/brand-catalog-2026-11-13.json";
import interactiveUiRaw from "../../docs/research/hasaki/interactive-ui-2026-11-14.json";

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
  return path.flatMap(slug => {
    const category = categories.find(item => item[1] === slug);
    return category ? [category] : [];
  });
}

export const products: readonly Product[] = [
  {
    brand: "CeraVe",
    name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu 473ml",
    price: 314000,
    old: 490000,
    sale: 36,
    slug: "sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml-102959.html",
    category: "sua-rua-mat-c19.html",
    image: "https://media.hcdn.vn/catalog/product/t/o/top_deal_422208973-1793763481.png",
    rating: 4.9,
    reviewCount: 116,
    sold: 58,
  },
  {
    brand: "Bioderma",
    name: "Nước Tẩy Trang Bioderma Dành Cho Da Nhạy Cảm 500ml",
    price: 360000,
    old: 560000,
    sale: 36,
    slug: "nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-9740.html",
    category: "tay-trang-mat-c48.html",
    image: "https://media.hcdn.vn/catalog/product/p/r/special-deal-nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml_vpfaZJebfCUHWGiS.png",
    rating: 4.9,
    reviewCount: 228,
    sold: 13,
  },
  {
    brand: "Anker",
    name: "Củ Sạc Nhanh 1C Anker Zolo A2698 30W Màu Đen",
    price: 270000,
    old: 350000,
    sale: 23,
    slug: "cu-sac-nhanh-1c-anker-zolo-a2698-30w-mau-den-276077.html",
    category: "phu-kien-dien-thoai-c2474.html",
    image: "https://media.hcdn.vn/catalog/product/f/a/facebook-dynamic-cu-sac-nhanh-1c-anker-zolo-a2698-30w-mau-den-1779090153.jpg",
    rating: 4.9,
    reviewCount: 12,
    sold: 12,
  },
  {
    brand: "Klairs",
    name: "Nước Hoa Hồng Klairs Không Mùi Cho Da Nhạy Cảm 180ml",
    price: 199000,
    old: 435000,
    sale: 54,
    slug: "nuoc-hoa-hong-khong-mui-klairs-danh-cho-da-nhay-cam-180ml-65994.html",
    category: "toner-c1857.html",
    image: "https://media.hcdn.vn/catalog/product/p/r/special-deal-nuoc-hoa-hong-khong-mui-klairs-danh-cho-da-nhay-cam-180ml_Q3RXcz8o68ffzNQo.png",
    rating: 4.9,
    reviewCount: 148,
    sold: 10,
  },
  {
    brand: "L'Oreal",
    name: "Nước Tẩy Trang L'Oreal Tươi Mát Cho Da Dầu, Hỗn Hợp 400ml",
    price: 139000,
    old: 249000,
    sale: 44,
    slug: "nuoc-tay-trang-tuoi-mat-l-oreal-3-in-1-danh-cho-da-dau-da-hon-hop-400ml-19325.html",
    category: "tay-trang-mat-c48.html",
    image: "https://media.hcdn.vn/catalog/product/p/r/special-deal-nuoc-tay-trang-tuoi-mat-l-oreal-3-in-1-danh-cho-da-dau-da-hon-hop-400ml_xhUdja9FtYx6ZjNv.png",
    rating: 4.9,
    reviewCount: 298,
    sold: 17,
  },
  {
    brand: "Skin1004",
    name: "Kem Chống Nắng Skin1004 Cho Da Nhạy Cảm SPF 50+ 50ml",
    price: 249000,
    old: 495000,
    sale: 50,
    slug: "kem-chong-nang-skin1004-chiet-xuat-rau-ma-spf50-pa-50ml-86167.html",
    category: "chong-nang-da-mat-c11.html",
    image: "https://media.hcdn.vn/catalog/product/f/a/facebook-dynamic-kem-chong-nang-skin1004-chiet-xuat-rau-ma-spf50-pa-50ml-1770272481.jpg",
    rating: 4.9,
    reviewCount: 119,
    sold: 67,
  },
  {
    brand: "Cocoon",
    name: "Combo 2 Nước Tẩy Trang Bí Đao Cocoon Làm Sạch & Giảm Dầu 500ml",
    price: 242000,
    old: 590000,
    sale: 59,
    slug: "combo-2-nuoc-tay-trang-bi-dao-cocoon-lam-sach-giam-dau-500ml-96589.html",
    category: "tay-trang-mat-c48.html",
    image: "https://media.hcdn.vn/catalog/product/p/r/special-deal-combo-2-nuoc-tay-trang-bi-dao-cocoon-lam-sach-giam-dau-500ml_GxuPEkRfLbuDQhcm.png",
    rating: 4.9,
    reviewCount: 57,
    sold: 23,
  },
  {
    brand: "Hada Labo",
    name: "Kem Rửa Mặt Hada Labo Sạch Sâu Dưỡng Ẩm 80g",
    price: 57000,
    old: 91500,
    sale: 38,
    slug: "kem-rua-mat-hada-labo-duong-am-toi-uu-80g-4359.html",
    category: "sua-rua-mat-c19.html",
    image: "https://media.hcdn.vn/catalog/product/p/r/special-deal-kem-rua-mat-hada-labo-duong-am-toi-uu-80g_Dw3Gx2Tt62M4sMzo.png",
    rating: 4.9,
    reviewCount: 87,
    sold: 27,
  },
];

export const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " ₫";

const categoryProductsMap = categoryProductsRaw as Record<string, Product[]>;

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
  "hasaki-clinic-spa": "dermahair-c2298.html",
  "my-pham": "cham-soc-da-mat-c4.html",
};

interface InteractiveUiSnapshot {
  megaMenu?: Array<{
    name: string;
    href: string;
    columns?: Array<{
      heading: string;
      href: string;
      items?: Array<{ label: string; href: string }>;
    }>;
  }>;
  searchPopup?: {
    suggestedCategories?: Array<{ name: string; href: string }>;
    topKeywords?: Array<{ label: string; href: string }>;
  };
  categoryPageUi?: {
    sidebarCategoryTree?: Array<{
      label: string;
      href: string;
      children?: Array<{ label: string; href: string }>;
    }>;
  };
}

const uiCategoryTitleMap = new Map<string, string>();
const uiCategoryParentMap = new Map<string, string>();

function normalizeCatHref(href: string): string {
  return href.replace(/^\/danh-muc\//i, "").trim();
}

(() => {
  for (const [title, slug] of categories) {
    uiCategoryTitleMap.set(slug, title);
    uiCategoryTitleMap.set(slug.replace(/\.html$/i, ""), title);
  }
  uiCategoryTitleMap.set("nha-cua-doi-song-c2529.html", "Nhà Cửa - Đời Sống");
  uiCategoryTitleMap.set("dien-gia-dung-c2463.html", "Điện Gia Dụng");
  uiCategoryTitleMap.set("loa-bluetooth-c2800.html", "Loa Bluetooth");
  uiCategoryTitleMap.set("my-pham-c3.html", "Mỹ Phẩm");
  uiCategoryTitleMap.set("hasaki-clinic-spa-c331.html", "Hasaki Clinic & Spa");

  const ui = interactiveUiRaw as unknown as InteractiveUiSnapshot;
  for (const root of ui.megaMenu || []) {
    const rootSlug = normalizeCatHref(root.href);
    if (rootSlug && root.name) {
      uiCategoryTitleMap.set(rootSlug, root.name);
      uiCategoryTitleMap.set(rootSlug.replace(/\.html$/i, ""), root.name);
    }
    for (const col of root.columns || []) {
      const colSlug = normalizeCatHref(col.href);
      if (colSlug) {
        if (col.heading) {
          uiCategoryTitleMap.set(colSlug, col.heading);
          uiCategoryTitleMap.set(colSlug.replace(/\.html$/i, ""), col.heading);
        }
        if (rootSlug) {
          uiCategoryParentMap.set(colSlug, rootSlug);
        }
      }
      for (const item of col.items || []) {
        const itemSlug = normalizeCatHref(item.href);
        if (itemSlug) {
          if (item.label) {
            uiCategoryTitleMap.set(itemSlug, item.label);
            uiCategoryTitleMap.set(itemSlug.replace(/\.html$/i, ""), item.label);
          }
          if (rootSlug) {
            uiCategoryParentMap.set(itemSlug, rootSlug);
          }
        }
      }
    }
  }
  for (const sc of ui.searchPopup?.suggestedCategories || []) {
    const s = normalizeCatHref(sc.href);
    if (s && sc.name) {
      uiCategoryTitleMap.set(s, sc.name);
      uiCategoryTitleMap.set(s.replace(/\.html$/i, ""), sc.name);
    }
  }
  for (const kw of ui.searchPopup?.topKeywords || []) {
    if (kw.href.startsWith("/danh-muc/")) {
      const s = normalizeCatHref(kw.href);
      if (s && kw.label && !uiCategoryTitleMap.has(s)) {
        uiCategoryTitleMap.set(s, kw.label);
      }
    }
  }
  for (const node of ui.categoryPageUi?.sidebarCategoryTree || []) {
    const s = normalizeCatHref(node.href);
    if (s && node.label && !uiCategoryTitleMap.has(s)) {
      uiCategoryTitleMap.set(s, node.label);
    }
    for (const child of node.children || []) {
      const cs = normalizeCatHref(child.href);
      if (cs && child.label && !uiCategoryTitleMap.has(cs)) {
        uiCategoryTitleMap.set(cs, child.label);
      }
    }
  }
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
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function resolveCategorySlug(inputSlug: string): string {
  if (categories.some(([, s]) => s === inputSlug) || categoryProductsMap[inputSlug]) {
    return inputSlug;
  }
  const withHtml = inputSlug.endsWith(".html") ? inputSlug : `${inputSlug}.html`;
  if (categories.some(([, s]) => s === withHtml) || categoryProductsMap[withHtml]) {
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

export function categoryProducts(slug: string): Product[] {
  const resolved = (categories.some(([, s]) => s === slug) || categoryProductsMap[slug])
    ? slug
    : resolveCategorySlug(slug);
  const facial = ["sua-rua-mat-c19.html", "tay-trang-mat-c48.html", "toner-c1857.html", "chong-nang-da-mat-c11.html"];
  let base: Product[] = [];
  if (resolved === "cham-soc-da-mat-c4.html") {
    base = products.filter(p => facial.includes(p.category));
  } else if (resolved === "lam-sach-da-c1855.html") {
    base = products.filter(p => ["sua-rua-mat-c19.html", "tay-trang-mat-c48.html"].includes(p.category));
  } else {
    base = products.filter(p => p.category === resolved);
  }

  const scraped = categoryProductsMap[resolved] || [];
  const seen = new Set(base.map(p => p.slug));
  const merged = [...base];

  for (const item of scraped) {
    if (!seen.has(item.slug)) {
      seen.add(item.slug);
      merged.push(item);
    }
  }
  if (merged.length === 0 && resolved) {
    return [...products];
  }
  return merged;
}

/**
 * Returns all unique products across core catalog, category snapshots, deals, bestsellers, and brand snapshots.
 */
export function getAllCatalogProducts(): Product[] {
  const map = new Map<string, Product>();
  for (const p of products) {
    map.set(p.slug, p);
  }
  for (const list of Object.values(categoryProductsMap)) {
    for (const item of list) {
      if (item.slug && !map.has(item.slug)) {
        map.set(item.slug, item);
      }
    }
  }
  const dealsList = ((dealsRaw as { products?: Product[] }).products) || [];
  for (const item of dealsList) {
    if (item.slug && !map.has(item.slug)) {
      map.set(item.slug, item);
    }
  }
  const bestList = ((bestsellersRaw as { products?: Product[] }).products) || [];
  for (const item of bestList) {
    if (item.slug && !map.has(item.slug)) {
      map.set(item.slug, item);
    }
  }
  const featuredBrands = (brandCatalogRaw as { featuredBrands?: Record<string, { name: string; topProducts?: Product[] }> }).featuredBrands || {};
  for (const brand of Object.values(featuredBrands)) {
    for (const item of brand.topProducts || []) {
      if (item.slug && !map.has(item.slug)) {
        map.set(item.slug, { ...item, brand: item.brand || brand.name });
      }
    }
  }
  return Array.from(map.values());
}

export function findCatalogProduct(slug: string): Product | undefined {
  const all = getAllCatalogProducts();
  const exact = all.find(item => item.slug === slug || item.slug === `${slug}.html`);
  if (exact) {
    return exact;
  }
  const norm = (s: string) => s.replace(/(?:-\d+)?\.html$/i, "").replace(/-\d+$/i, "").toLowerCase();
  const target = norm(slug);
  return all.find(item => norm(item.slug) === target);
}
