/**
 * Data-Driven Interactive UI & Navigation Service for Hasaki Clone.
 * Powered by live Playwright hover/click DOM scraping (docs/research/hasaki/interactive-ui-2026-11-14.json),
 * category facets, and brand catalog — eliminating hardcoded UI arrays across Header, Search, Category, and Product views.
 */

import rawInteractiveUi from "../../docs/research/hasaki/interactive-ui-2026-11-14.json";
import rawBrandCatalog from "../../docs/research/hasaki/brand-catalog-2026-11-13.json";
import { categories, getAllCatalogProducts, type Product } from "@/lib/catalog";
import { getSubcategoriesForCategory } from "@/lib/category-facets";

export interface TopKeywordItem {
  label: string;
  href: string;
}

export interface PromoPillItem {
  label: string;
  href: string;
}

export interface SuggestedCategoryCard {
  label: string;
  href: string;
  img: string;
  imgAlt: string;
}

export interface SuggestedBrandCard {
  name: string;
  href: string;
  logo: string;
}

export interface MegaMenuSubGroup {
  title: string;
  href: string;
  items: Array<{ label: string; href: string }>;
}

export interface MegaMenuCategoryItem {
  name: string;
  slug: string;
  href: string;
  groups: MegaMenuSubGroup[];
  featuredBrands: SuggestedBrandCard[];
}

export interface BrandBannerLogo {
  name: string;
  src: string;
  href: string;
}

export interface ShippingPolicyItem {
  badge: string;
  title: string;
  subtitle: string;
}

export interface SkinVariantSwatch {
  id: string;
  label: string;
  thumb: string;
}

export interface ProductGiftBill {
  brand: string;
  minBill: number;
  giftName: string;
  badgeText: string;
  fullText: string;
}

export interface BranchStockItem {
  branchId: string;
  branchName: string;
  quantity: number;
  inStock: boolean;
}

export interface ProductBranchStockSummary {
  sku: string;
  productSlug: string;
  productName: string;
  totalStock: number;
  availableStock: number;
  warehouseStatus: "in_stock" | "low_stock" | "out_of_stock";
  inStock: boolean;
  nowFree2HAvailable: boolean;
  branchesWithStockCount: number;
  branches: BranchStockItem[];
  stockBadgeText: string;
}

export interface InteractiveUiDataset {
  scrapedAt: string;
  source: string;
  topBanner: {
    alt: string;
    src: string;
    href: string;
  };
  searchPopup: {
    topBarKeywords: TopKeywordItem[];
    promoPills: PromoPillItem[];
    suggestedCategories: SuggestedCategoryCard[];
    suggestedBrands: SuggestedBrandCard[];
  };
  megaMenu: MegaMenuCategoryItem[];
  categoryPageUi: {
    brandBannerLogos: BrandBannerLogo[];
    sidebarCategoryTree: TopKeywordItem[];
    sortTabs: string[];
    pageSizeOptions: string[];
  };
  dealsPageUi: {
    categoryPills: string[];
  };
  productDetailPageUi: {
    ministryBadgePrefix: string;
    defaultMinistryCode: string;
    shippingPolicies: ShippingPolicyItem[];
    capacityOptions: string[];
    skinVariantSwatches: SkinVariantSwatch[];
    sectionAnchors: string[];
  };
  giftBills: ProductGiftBill[];
  giftBillsByBrand: Record<string, ProductGiftBill>;
}

export const BRAND_GIFT_BILLS: ProductGiftBill[] = [
  {
    brand: "Klairs",
    minBill: 399000,
    giftName: "Nước Hoa Hồng Không Mùi 30ml",
    badgeText: "Bill Klairs từ 399K Tặng Nước Hoa Hồng Không Mùi 30ml",
    fullText: "Bill Klairs từ 399K Tặng Nước Hoa Hồng Không Mùi Cho Da Nhạy Cảm 30ml (SL Có Hạn)",
  },
  {
    brand: "L'Oreal",
    minBill: 239000,
    giftName: "Nước Tẩy Trang L'Oreal 95ml",
    badgeText: "Bill 239K L'Oreal Tặng Nước Tẩy Trang L'Oreal 95ml",
    fullText: "Bill 239K L'Oreal Tặng Nước Tẩy Trang L'Oreal 95ml (SL có hạn)",
  },
  {
    brand: "Bioderma",
    minBill: 499000,
    giftName: "Nước Tẩy Trang Bioderma 100ml",
    badgeText: "Bill 499K Bioderma Tặng Tẩy Trang Sensibio 100ml",
    fullText: "Bill Bioderma từ 499K Tặng Nước Tẩy Trang Bioderma Sensibio H2O 100ml (SL Có Hạn)",
  },
  {
    brand: "CeraVe",
    minBill: 319000,
    giftName: "Bông Tẩy Trang 80 Miếng & SRM 30ml",
    badgeText: "Bill CeraVe 319K Tặng Bông Tẩy Trang 80 Miếng",
    fullText: "Bill CeraVe từ 319K Tặng Sữa Rửa Mặt CeraVe Sạch Sâu 30ml + Bông Tẩy Trang (SL Có Hạn)",
  },
  {
    brand: "Cocoon",
    minBill: 299000,
    giftName: "Kem Mặt Nạ Nghệ Hưng Yên 30ml",
    badgeText: "Bill 299K Cocoon Mua Kem Mặt Nạ Nghệ Tặng Gel Rửa Mặt",
    fullText: "Bill 299K Cocoon Mua Kem Mặt Nạ Nghệ Hưng Yên Tặng Gel Rửa Mặt Bí Đao 30ml",
  },
  {
    brand: "Cetaphil",
    minBill: 299000,
    giftName: "Sữa Rửa Mặt Cetaphil 59ml",
    badgeText: "Bill 299K Cetaphil, Benzac tặng Sữa Rửa Mặt 59ml",
    fullText: "Bill 299K Cetaphil, Benzac Tặng Sữa Rửa Mặt Dịu Nhẹ Cetaphil 59ml Trị Giá 120K",
  },
  {
    brand: "La Roche-Posay",
    minBill: 499000,
    giftName: "Kem Dưỡng B5+ 15ml & Xịt Khoáng 50ml",
    badgeText: "Đơn từ 499K Tặng Kem Dưỡng B5+ & Xịt Khoáng 50ml",
    fullText: "Đơn La Roche-Posay từ 499K Tặng Kem Dưỡng Cicaplast Baume B5+ 15ml (SL Có Hạn)",
  },
  {
    brand: "Skin1004",
    minBill: 299000,
    giftName: "Tinh Chất Rau Má Madagascar 30ml",
    badgeText: "Bill Skin1004 299K Tặng Tinh Chất Rau Má 30ml",
    fullText: "Bill Skin1004 từ 299K Tặng Tinh Chất Rau Má Centella Ampoule 30ml (SL Có Hạn)",
  },
  {
    brand: "Garnier",
    minBill: 159000,
    giftName: "Nước Tẩy Trang Garnier 50ml",
    badgeText: "Bill 159K Garnier Tặng Nước Tẩy Trang 50ml",
    fullText: "Bill 159K Garnier Tặng Nước Tẩy Trang Micellar Cleansing Water 50ml",
  },
];

const ENGLISH_SUBTITLES_BY_KEYWORD: Array<{ match: RegExp; subtitle: string }> = [
  { match: /bioderma.*nhạy cảm|sensibio/i, subtitle: "Sensibio H2O Micellar Water" },
  { match: /bioderma.*dầu|sébium|sebium/i, subtitle: "Sébium H2O Purifying Micellar Water" },
  { match: /cerave.*sạch sâu|cerave.*dầu/i, subtitle: "Foaming Cleanser For Normal To Oily Skin" },
  { match: /cerave.*dịu nhẹ|cerave.*khô/i, subtitle: "Hydrating Facial Cleanser" },
  { match: /cetaphil.*rửa mặt/i, subtitle: "Gentle Skin Cleanser (New Formula)" },
  { match: /klairs.*không mùi|klairs.*toner/i, subtitle: "Supple Preparation Unscented Toner" },
  { match: /l'oreal.*tươi mát|l'oreal.*3-in-1/i, subtitle: "Micellar Water 3-in-1 Refreshing Even For Sensitive Skin" },
  { match: /l'oreal.*sạch sâu/i, subtitle: "Micellar Water 3-in-1 Deep Cleansing" },
  { match: /cocoon.*bí đao/i, subtitle: "Winter Melon Micellar Water & Cleanser" },
  { match: /skin1004.*chống nắng|skin1004.*rau má/i, subtitle: "Madagascar Centella Air-Fit Suncream Plus SPF50+" },
  { match: /la roche-posay.*chống nắng|anthelios/i, subtitle: "Anthelios UVMune 400 Oil Control Gel-Cream" },
  { match: /la roche-posay.*b5|cicaplast/i, subtitle: "Cicaplast Baume B5+ Ultra-Repairing Soothing Balm" },
  { match: /hada labo.*rửa mặt/i, subtitle: "Advanced Nourish Hyaluron Cleanser" },
  { match: /anessa/i, subtitle: "Perfect UV Sunscreen Skincare Milk N SPF50+ PA++++" },
  { match: /paula's choice.*bha/i, subtitle: "Skin Perfecting 2% BHA Liquid Exfoliant" },
  { match: /anker.*zolo|anker.*30w/i, subtitle: "Anker Zolo PD 30W Fast Charger Type-C" },
];

export function computeProductEnglishSubtitle(product: {
  name: string;
  brand: string;
  description?: string;
}): string {
  if (product.description && product.description.length > 3 && product.description.length < 75 && product.description !== product.name) {
    return product.description;
  }
  for (const rule of ENGLISH_SUBTITLES_BY_KEYWORD) {
    if (rule.match.test(product.name)) {
      return rule.subtitle;
    }
  }
  return `${product.brand} Official Authentic Skincare Formula`;
}

export function computeGiftBillPromo(product: {
  brand: string;
  price: number;
  name: string;
}): ProductGiftBill {
  const brandLower = product.brand.toLowerCase();
  const matched = BRAND_GIFT_BILLS.find((b) => b.brand.toLowerCase() === brandLower);
  if (matched) {
    return matched;
  }

  const rawThreshold = Math.max(199, Math.ceil((product.price * 1.2) / 10000) * 10);
  const minBill = rawThreshold * 1000;
  const lowerName = product.name.toLowerCase();
  let giftName = `Quà Tặng Mini ${product.brand}`;
  if (lowerName.includes("chống nắng")) giftName = `Kem Chống Nắng Mini ${product.brand} 15ml`;
  else if (lowerName.includes("rửa mặt")) giftName = `Sữa Rửa Mặt ${product.brand} 30ml`;
  else if (lowerName.includes("tẩy trang")) giftName = `Nước Tẩy Trang ${product.brand} 95ml`;
  else if (lowerName.includes("toner") || lowerName.includes("hoa hồng")) giftName = `Toner ${product.brand} 30ml`;

  return {
    brand: product.brand,
    minBill,
    giftName,
    badgeText: `Bill ${rawThreshold}K ${product.brand} Tặng ${giftName}`,
    fullText: `Bill ${product.brand} từ ${rawThreshold}K Tặng ${giftName} (SL Có Hạn)`,
  };
}

function normalizeInternalHref(href: string): string {
  if (!href) return "/";
  const stripped = href.replace(/^https?:\/\/(www\.)?hasaki\.vn/i, "").split("?")[0];
  if (stripped.startsWith("/campaign/") && stripped !== "/campaign/wow") {
    return "/campaign/wow";
  }
  if (stripped.startsWith("/cam-nang/")) {
    return "/cam-nang.html";
  }
  return stripped || "/";
}

function buildMegaMenuTree(defaultBrands: SuggestedBrandCard[]): MegaMenuCategoryItem[] {
  const logosRaw =
    (
      rawBrandCatalog as {
        logos?: Record<string, { name: string; slug?: string; logo?: string; image?: string }>;
      }
    ).logos || {};

  const extraBrands: SuggestedBrandCard[] = Object.values(logosRaw)
    .filter((b) => b && (b.logo || b.image))
    .slice(0, 50)
    .map((b) => ({
      name: b.name,
      href: `/thuong-hieu/${(b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/\.html$/i, "")}.html`,
      logo: b.logo || b.image || "",
    }));

  const brandPool = [...defaultBrands, ...extraBrands];

  const rootCategories = categories.slice(0, 16);
  return rootCategories.map(([catName, catSlug], idx) => {
    const subcats = getSubcategoriesForCategory(catSlug);
    const group1Items = subcats.slice(0, 5).map(([childName, childSlug]) => ({
      label: childName,
      href: `/danh-muc/${childSlug}`,
    }));
    const group2Items = subcats.slice(5, 10).map(([childName, childSlug]) => ({
      label: childName,
      href: `/danh-muc/${childSlug}`,
    }));

    const fallbackItems = categories
      .slice((idx * 3) % categories.length, ((idx * 3) % categories.length) + 6)
      .map(([n, s]) => ({ label: n, href: `/danh-muc/${s}` }));

    const groups: MegaMenuSubGroup[] = [
      {
        title: `Danh mục ${catName}`,
        href: `/danh-muc/${catSlug}`,
        items: group1Items.length > 0 ? group1Items : fallbackItems.slice(0, 4),
      },
      {
        title: "Chăm sóc chuyên sâu & Xu hướng",
        href: `/danh-muc/${catSlug}`,
        items:
          group2Items.length > 0
            ? group2Items
            : [
                { label: "Sản Phẩm Bán Chạy Nhất", href: "/san-pham-ban-chay.html" },
                { label: "Hàng Mới Về Chính Hãng", href: "/hang-moi-ve.html" },
                { label: "Flash Deal Giảm Sâu", href: "/deals-dang-dien-ra.html" },
                { label: "Dược Mỹ Phẩm Cao Cấp", href: "/danh-muc/my-pham-high-end-c1907.html" },
              ],
      },
      {
        title: "Dịch vụ & Trải nghiệm Hasaki",
        href: "/dich-vu-phong-kham.html",
        items: [
          { label: "Phòng Khám Da Liễu Hasaki Clinic", href: "/dich-vu-phong-kham.html" },
          { label: "Bảng Giá Dịch Vụ Điều Trị", href: "/bang-gia-dich-vu.html" },
          { label: "Cẩm Nang Làm Đẹp Y Khoa", href: "/cam-nang.html" },
          { label: "Đặt Lịch Khám Da Miễn Phí", href: "/dat-lich-kham" },
        ],
      },
    ];

    const rotatedBrands = brandPool.slice(idx % 3, (idx % 3) + 6);

    return {
      name: catName,
      slug: catSlug,
      href: `/danh-muc/${catSlug}`,
      groups,
      featuredBrands: rotatedBrands.length > 0 ? rotatedBrands : defaultBrands.slice(0, 6),
    };
  });
}

let cachedInteractiveData: InteractiveUiDataset | null = null;

export function getInteractiveUiData(): InteractiveUiDataset {
  if (cachedInteractiveData) return cachedInteractiveData;

  const suggestedBrands: SuggestedBrandCard[] = (rawInteractiveUi.searchPopup?.suggestedBrands || []).map((b) => ({
    name: b.name,
    href: normalizeInternalHref(b.href),
    logo: b.logo,
  }));

  const promoPills: PromoPillItem[] = (rawInteractiveUi.searchPopup?.promoPills || []).map((p) => ({
    label: p.label,
    href: normalizeInternalHref(p.href),
  }));

  const suggestedCategories: SuggestedCategoryCard[] = (
    rawInteractiveUi.searchPopup?.suggestedCategories || []
  ).map((c) => ({
    label: c.label,
    href: normalizeInternalHref(c.href),
    img: c.img,
    imgAlt: c.imgAlt || c.label,
  }));

  const topBarKeywords: TopKeywordItem[] = (rawInteractiveUi.searchPopup?.topBarKeywords || [])
    .slice(0, 6)
    .map((k) => ({
      label: k.label,
      href: normalizeInternalHref(k.href),
    }));

  const brandBannerLogos: BrandBannerLogo[] = (rawInteractiveUi.categoryPageUi?.brandBannerLogos || []).map((b) => ({
    name: b.name,
    src: b.src,
    href: b.href,
  }));

  const rawSidebarTree = rawInteractiveUi.categoryPageUi?.sidebarCategoryTree || [];
  const startTreeIdx = rawSidebarTree.findIndex((s) => s.label === "Sản Phẩm Cao Cấp");
  const sidebarCategoryTree: TopKeywordItem[] = (
    startTreeIdx >= 0 ? rawSidebarTree.slice(startTreeIdx) : rawSidebarTree
  ).map((s) => ({
    label: s.label,
    href: normalizeInternalHref(s.href),
  }));

  const cleanCategoryPills = (rawInteractiveUi.dealsPageUi?.categoryPills || []).filter(
    (p: string) => !p.startsWith("-") && !p.includes("₫")
  );

  const giftBillsByBrand: Record<string, ProductGiftBill> = {};
  for (const g of BRAND_GIFT_BILLS) {
    giftBillsByBrand[g.brand.toLowerCase()] = g;
  }

  cachedInteractiveData = {
    scrapedAt: rawInteractiveUi.scrapedAt || "2026-11-14T03:49:14.377Z",
    source: rawInteractiveUi.source || "https://hasaki.vn/",
    topBanner: {
      alt: rawInteractiveUi.topBanner?.alt || "9/11 - 30/11 Combo Giá Tốt Mua 1 Tặng 1 Fullsize",
      src:
        rawInteractiveUi.topBanner?.src ||
        "https://media.hcdn.vn/hsk/17939497221793948460613-1320-x-50.jpg",
      href: "/campaign/wow",
    },
    searchPopup: {
      topBarKeywords,
      promoPills,
      suggestedCategories,
      suggestedBrands,
    },
    megaMenu: buildMegaMenuTree(suggestedBrands),
    categoryPageUi: {
      brandBannerLogos,
      sidebarCategoryTree,
      sortTabs: rawInteractiveUi.categoryPageUi?.sortTabs || [
        "Mới nhất",
        "Bán chạy",
        "Giá thấp đến cao",
        "Giá cao đến thấp",
      ],
      pageSizeOptions: rawInteractiveUi.categoryPageUi?.pageSizeOptions || [
        "Hiển thị 40",
        "Hiển thị 60",
        "Hiển thị 80",
      ],
    },
    dealsPageUi: {
      categoryPills: cleanCategoryPills.length > 0 ? cleanCategoryPills : ["Tất cả", "Chăm Sóc Da Mặt", "Trang Điểm"],
    },
    productDetailPageUi: {
      ministryBadgePrefix:
        rawInteractiveUi.productDetailPageUi?.ministryBadgePrefix || "Số công bố với Bộ Y Tế",
      defaultMinistryCode:
        rawInteractiveUi.productDetailPageUi?.defaultMinistryCode || "278237/25/CBMP-QLD",
      shippingPolicies: rawInteractiveUi.productDetailPageUi?.shippingPolicies || [],
      capacityOptions: rawInteractiveUi.productDetailPageUi?.capacityOptions || [
        "Combo 1000ml",
        "100ml",
        "250ml",
        "500ml",
      ],
      skinVariantSwatches: rawInteractiveUi.productDetailPageUi?.skinVariantSwatches || [],
      sectionAnchors: rawInteractiveUi.productDetailPageUi?.sectionAnchors || [
        "Thông tin sản phẩm",
        "Thông số sản phẩm",
        "Thành phần sản phẩm",
        "Cách dùng",
        "Đánh giá",
        "Hỏi đáp",
      ],
    },
    giftBills: BRAND_GIFT_BILLS,
    giftBillsByBrand,
  };

  return cachedInteractiveData;
}

export function searchCatalogLive(
  query: string,
  limit = 6
): {
  products: Product[];
  matchedBrands: Array<{ name: string; href: string }>;
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { products: [], matchedBrands: [] };
  }

  const all = getAllCatalogProducts();
  const matched = all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
  );

  const uniqueBrands = Array.from(new Set(matched.map((p) => p.brand))).slice(0, 5);
  return {
    products: matched.slice(0, limit),
    matchedBrands: uniqueBrands.map((name) => ({
      name,
      href: `/thuong-hieu/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
    })),
  };
}
