import { getStaticCatalogOverrides, type LiveCatalogOverridesState } from "@/lib/live-catalog";
import { categories, getAllCatalogProducts, type Product } from "@/lib/catalog";
import { getSubcategoriesForCategory } from "@/lib/category-facets";

/**
 * Data-Driven Interactive UI & Navigation Service for Nari Home.
 * Mega menu and search autocomplete derive dynamically from live catalog references and products.
 */

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

export const BRAND_GIFT_BILLS: ProductGiftBill[] = [];

export function computeProductEnglishSubtitle(product: {
  name: string;
  brand: string;
  englishName?: string;
  description?: string;
}): string | null {
  return product.englishName?.trim() || null;
}

export function computeGiftBillPromo(product: {
  brand: string;
  price: number;
  name: string;
}): ProductGiftBill | null {
  const brandLower = product.brand.toLowerCase();
  const matched = BRAND_GIFT_BILLS.find((b) => b.brand.toLowerCase() === brandLower);
  return matched ?? null;
}

function buildBrandSlug(nameOrSlug: string): string {
  const clean = nameOrSlug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/\.html$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean || "brand"}.html`;
}

function extractSuggestedBrands(liveCatalog: LiveCatalogOverridesState): SuggestedBrandCard[] {
  const brandRefs = liveCatalog.references?.brands || [];
  if (brandRefs.length > 0) {
    return brandRefs.slice(0, 24).map((b) => ({
      name: b.label,
      href: `/thuong-hieu/${b.slug.endsWith(".html") ? b.slug : `${b.slug}.html`}`,
      logo: "",
    }));
  }

  const deleted = new Set(liveCatalog.deletedSlugs);
  const seen = new Set<string>();
  const derived: SuggestedBrandCard[] = [];
  for (const prod of Object.values(liveCatalog.products)) {
    if (!prod.slug || deleted.has(prod.slug) || !prod.brand) continue;
    const key = prod.brand.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    derived.push({
      name: prod.brand,
      href: `/thuong-hieu/${buildBrandSlug(prod.brand)}`,
      logo: "",
    });
    if (derived.length >= 24) break;
  }
  return derived;
}

function buildMegaMenuTree(
  defaultBrands: SuggestedBrandCard[],
  liveCatalog: LiveCatalogOverridesState
): MegaMenuCategoryItem[] {
  const refCats = liveCatalog.references?.categories || [];

  if (refCats.length > 0) {
    const roots = refCats.filter((c) => !c.parentId).slice(0, 16);
    const effectiveRoots = roots.length > 0 ? roots : refCats.slice(0, 16);

    return effectiveRoots.map((root, idx) => {
      const children = refCats.filter((c) => c.parentId === root.id);
      const group1Items = children.slice(0, 5).map((child) => ({
        label: child.label,
        href: `/danh-muc/${child.slug}`,
      }));
      const group2Items = children.slice(5, 10).map((child) => ({
        label: child.label,
        href: `/danh-muc/${child.slug}`,
      }));

      const rotatedBrands = defaultBrands.slice(idx % Math.max(1, defaultBrands.length), (idx % Math.max(1, defaultBrands.length)) + 6);

      return {
        name: root.label,
        slug: root.slug,
        href: `/danh-muc/${root.slug}`,
        groups: [
          {
            title: `Danh mục ${root.label}`,
            href: `/danh-muc/${root.slug}`,
            items: group1Items.length > 0 ? group1Items : [{ label: root.label, href: `/danh-muc/${root.slug}` }],
          },
          {
            title: "Chăm sóc chuyên sâu & Xu hướng",
            href: `/danh-muc/${root.slug}`,
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
            title: "Dịch vụ & Trải nghiệm Nari Home",
            href: "/dich-vu-phong-kham.html",
            items: [
              { label: "Phòng Khám Da Liễu Nari Clinic & Spa", href: "/dich-vu-phong-kham.html" },
              { label: "Bảng Giá Dịch Vụ Điều Trị", href: "/bang-gia-dich-vu.html" },
              { label: "Cẩm Nang Làm Đẹp Y Khoa", href: "/cam-nang.html" },
              { label: "Đặt Lịch Khám Da Miễn Phí", href: "/dat-lich-kham" },
            ],
          },
        ],
        featuredBrands: rotatedBrands.length > 0 ? rotatedBrands : defaultBrands.slice(0, 6),
      };
    });
  }

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
        title: "Dịch vụ & Trải nghiệm Nari Home",
        href: "/dich-vu-phong-kham.html",
        items: [
          { label: "Phòng Khám Da Liễu Nari Clinic & Spa", href: "/dich-vu-phong-kham.html" },
          { label: "Bảng Giá Dịch Vụ Điều Trị", href: "/bang-gia-dich-vu.html" },
          { label: "Cẩm Nang Làm Đẹp Y Khoa", href: "/cam-nang.html" },
          { label: "Đặt Lịch Khám Da Miễn Phí", href: "/dat-lich-kham" },
        ],
      },
    ];

    const rotatedBrands = defaultBrands.slice(idx % Math.max(1, defaultBrands.length), (idx % Math.max(1, defaultBrands.length)) + 6);

    return {
      name: catName,
      slug: catSlug,
      href: `/danh-muc/${catSlug}`,
      groups,
      featuredBrands: rotatedBrands.length > 0 ? rotatedBrands : defaultBrands.slice(0, 6),
    };
  });
}

export function getInteractiveUiData(
  liveCatalog: LiveCatalogOverridesState = getStaticCatalogOverrides()
): InteractiveUiDataset {
  const suggestedBrands = extractSuggestedBrands(liveCatalog);
  const refCats = liveCatalog.references?.categories || [];

  const promoPills: PromoPillItem[] = [
    { label: "Flash Deals", href: "/deals-dang-dien-ra.html" },
    { label: "Bán Chạy Nhất", href: "/san-pham-ban-chay.html" },
    { label: "Hàng Mới Về", href: "/hang-moi-ve.html" },
  ];

  const topBarKeywords: TopKeywordItem[] =
    refCats.length > 0
      ? refCats.slice(0, 6).map((c) => ({ label: c.label, href: `/danh-muc/${c.slug}` }))
      : categories.slice(0, 6).map(([label, slug]) => ({ label, href: `/danh-muc/${slug}` }));

  const suggestedCategories: SuggestedCategoryCard[] =
    refCats.length > 0
      ? refCats.slice(0, 8).map((c) => ({
          label: c.label,
          href: `/danh-muc/${c.slug}`,
          img: "",
          imgAlt: c.label,
        }))
      : categories.slice(0, 8).map(([label, slug]) => ({
          label,
          href: `/danh-muc/${slug}`,
          img: "",
          imgAlt: label,
        }));

  const sidebarCategoryTree: TopKeywordItem[] =
    refCats.length > 0
      ? refCats.slice(0, 12).map((c) => ({ label: c.label, href: `/danh-muc/${c.slug}` }))
      : categories.slice(0, 12).map(([label, slug]) => ({ label, href: `/danh-muc/${slug}` }));

  const firstBanner = liveCatalog.banners?.heroSlides?.[0];

  const shippingPolicies: ShippingPolicyItem[] = [
    {
      badge: "NariNow 2H",
      title: "Giao Nhanh Miễn Phí 2H.",
      subtitle: "Trễ tặng 100K",
    },
    {
      badge: "Hàng Chính Hãng 100%",
      title: "Nari Home đền bù 200%",
      subtitle: "cam kết 100% chính hãng nếu phát hiện hàng giả",
    },
    {
      badge: "Freeship Toàn Quốc",
      title: "Giao Hàng Miễn Phí",
      subtitle: "(từ 90K tại nội thành, toàn Quốc từ 249K)",
    },
    {
      badge: "Đổi Trả 30 Ngày",
      title: "Đổi trả",
      subtitle: "trong 30 ngày",
    },
  ];

  const giftBillsByBrand: Record<string, ProductGiftBill> = {};
  for (const g of BRAND_GIFT_BILLS) {
    giftBillsByBrand[g.brand.toLowerCase()] = g;
  }

  return {
    scrapedAt: liveCatalog.updatedAt || "",
    source: "https://narihome.vn/",
    topBanner: {
      alt: firstBanner?.alt || "Nari Home Beauty & Clinic — Mỹ phẩm chính hãng 100%",
      src: firstBanner?.src || "/nari-home-banner.jpg",
      href: firstBanner?.href || "/campaign/wow",
    },
    searchPopup: {
      topBarKeywords,
      promoPills,
      suggestedCategories,
      suggestedBrands,
    },
    megaMenu: buildMegaMenuTree(suggestedBrands, liveCatalog),
    categoryPageUi: {
      brandBannerLogos: [],
      sidebarCategoryTree,
      sortTabs: ["Mới nhất", "Bán chạy", "Giá thấp đến cao", "Giá cao đến thấp"],
      pageSizeOptions: ["Hiển thị 40", "Hiển thị 60", "Hiển thị 80"],
    },
    dealsPageUi: {
      categoryPills: ["Tất cả", ...categories.slice(0, 8).map(([name]) => name)],
    },
    productDetailPageUi: {
      ministryBadgePrefix: "Số công bố với Bộ Y Tế",
      defaultMinistryCode: "278237/25/CBMP-QLD",
      shippingPolicies,
      capacityOptions: ["100ml", "250ml", "500ml"],
      skinVariantSwatches: [],
      sectionAnchors: [
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
}

export function searchCatalogLive(
  query: string,
  limit = 6,
  liveCatalog?: LiveCatalogOverridesState
): {
  products: Product[];
  matchedBrands: Array<{ name: string; href: string }>;
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { products: [], matchedBrands: [] };
  }

  const all = getAllCatalogProducts(liveCatalog);
  const matched = all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
  );

  const refBrands = (liveCatalog?.references?.brands || [])
    .filter((b) => b.label.toLowerCase().includes(q))
    .map((b) => ({
      name: b.label,
      href: `/thuong-hieu/${b.slug.endsWith(".html") ? b.slug : `${b.slug}.html`}`,
    }));

  const brandNamesFromProducts = Array.from(new Set(matched.map((p) => p.brand))).map((name) => ({
    name,
    href: `/thuong-hieu/${buildBrandSlug(name)}`,
  }));

  const mergedBrandsMap = new Map<string, { name: string; href: string }>();
  for (const b of [...refBrands, ...brandNamesFromProducts]) {
    const key = b.name.toLowerCase();
    if (!mergedBrandsMap.has(key)) mergedBrandsMap.set(key, b);
  }

  return {
    products: matched.slice(0, limit),
    matchedBrands: Array.from(mergedBrandsMap.values()).slice(0, 5),
  };
}
