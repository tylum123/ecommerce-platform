import type { FacetGroup, FacetOption } from "@/lib/backend-contracts";
import { categories, type Product } from "@/lib/catalog";

const facetPriority: Record<string, number> = {
  filter_brand: 1,
  filter_price: 2,
  filter_category: 3,
  filter_origin: 4,
  filter_nari_skin_type: 5,
  filter_nari_uses: 6,
  filter_nari_structure: 7,
  filter_nari_size: 8,
  filter_nari_ingredient: 9,
  filter_nari_skin_problem: 10,
  filter_nari_product_type: 11,
  filter_dac_tinh: 12,
  filter_sex: 13,
  filter_nari_tones: 14,
  filter_nari_product_line: 15,
};

const originBrandsMap: Record<string, string[]> = {
  "Pháp": ["bioderma", "la roche-posay", "l'oreal", "vichy", "avene", "svr", "caudalie", "nuxe", "laroche posay"],
  "Hàn Quốc": ["skin1004", "klairs", "some by mi", "banobagi", "bnbg", "cosrx", "torriden", "round lab", "beauty of joseon", "3ce", "anua", "medicube", "b.o.m", "judydoll"],
  "Việt Nam": ["cocoon", "cỏ mềm", "thorakao", "milaganics", "avander"],
  "Nhật Bản": ["hada labo", "rohto", "senka", "anessa", "biore", "dhc", "sk-ii", "curel", "sunplay"],
  "Mỹ": ["cerave", "paula's choice", "neutrogena", "clinique", "estee lauder", "anker", "kiehl's", "tresemme"],
  "Đức": ["eucerin", "nivea", "sebamed"],
  "Anh": ["simple", "the body shop"],
  "Úc": ["australis", "sukkin"],
  "Thụy Sĩ": ["skincode"],
  "Canada": ["the ordinary"],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/**
 * Computes dynamic brand, price, category, and origin facets from supplied items.
 * Returns [] when no items are provided.
 */
export function getCategoryFacets(slug: string, items: readonly Product[] = []): FacetGroup[] {
  void slug;
  if (!items || items.length === 0) return [];

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const originCounts = new Map<string, number>();

  let priceUnder100 = 0;
  let price100to300 = 0;
  let price300to500 = 0;
  let priceAbove500 = 0;

  for (const item of items) {
    if (item.brand) {
      brandCounts.set(item.brand, (brandCounts.get(item.brand) || 0) + 1);
      const brandNorm = normalizeText(item.brand);
      for (const [country, brands] of Object.entries(originBrandsMap)) {
        if (brands.some((b) => brandNorm.includes(normalizeText(b)))) {
          originCounts.set(country, (originCounts.get(country) || 0) + 1);
          break;
        }
      }
    }
    if (item.category) {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1);
    }
    if (item.price < 100000) priceUnder100++;
    else if (item.price <= 300000) price100to300++;
    else if (item.price <= 500000) price300to500++;
    else priceAbove500++;
  }

  const groups: FacetGroup[] = [];

  if (brandCounts.size > 0) {
    const options: FacetOption[] = Array.from(brandCounts.entries())
      .map(([name, count]) => ({ label: name, value: name, count }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    groups.push({ key: "filter_brand", name: "Thương hiệu", options });
  }

  const priceOptions: FacetOption[] = [
    { label: "Dưới 100.000 ₫", value: "0-100000", count: priceUnder100 },
    { label: "100.000 ₫ - 300.000 ₫", value: "100000-300000", count: price100to300 },
    { label: "300.000 ₫ - 500.000 ₫", value: "300000-500000", count: price300to500 },
    { label: "Trên 500.000 ₫", value: "500000-max", count: priceAbove500 },
  ].filter((opt) => (opt.count ?? 0) > 0);

  if (priceOptions.length > 0) {
    groups.push({ key: "filter_price", name: "Khoảng giá", options: priceOptions });
  }

  if (categoryCounts.size > 0) {
    const options: FacetOption[] = Array.from(categoryCounts.entries())
      .map(([catSlug, count]) => {
        const match = categories.find((c) => c[1] === catSlug);
        return { label: match ? match[0] : catSlug, value: catSlug, count };
      })
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    groups.push({ key: "filter_category", name: "Danh mục", options });
  }

  if (originCounts.size > 0) {
    const options: FacetOption[] = Array.from(originCounts.entries())
      .map(([country, count]) => ({ label: country, value: country, count }))
      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    groups.push({ key: "filter_origin", name: "Xuất xứ thương hiệu", options });
  }

  groups.sort((a, b) => (facetPriority[a.key] ?? 99) - (facetPriority[b.key] ?? 99));
  return groups;
}

const subcategorySlugsMap: Record<string, string[]> = {
  "cham-soc-da-mat-c4.html": [
    "lam-sach-da-c1855.html",
    "chong-nang-da-mat-c11.html",
    "sua-rua-mat-c19.html",
    "tay-trang-mat-c48.html",
    "toner-c1857.html",
    "serum-tinh-chat-c75.html",
    "kem-duong-dau-duong-c9.html",
    "mat-na-giay-c31.html",
    "tay-te-bao-chet-da-mat-c35.html",
    "khan-bong-tay-trang-c47.html",
  ],
  "lam-sach-da-c1855.html": [
    "sua-rua-mat-c19.html",
    "tay-trang-mat-c48.html",
    "tay-te-bao-chet-da-mat-c35.html",
    "khan-bong-tay-trang-c47.html",
  ],
  "cham-soc-toc-c96.html": [
    "dau-goi-c97.html",
    "bo-goi-xa-c2152.html",
    "dermahair-c2298.html",
  ],
  "trang-diem-c23.html": [
    "son-kem-tint-c49.html",
  ],
  "gia-dung-doi-song-c2440.html": [
    "phu-kien-dien-thoai-c2474.html",
    "cap-sac-c2693.html",
    "thiet-bi-am-thanh-c2930.html",
    "ve-sinh-nha-cua-c2462.html",
  ],
  "phu-kien-dien-thoai-c2474.html": [
    "cap-sac-c2693.html",
    "thiet-bi-am-thanh-c2930.html",
  ],
  "thoi-trang-c2351.html": [
    "thoi-trang-nam-c2359.html",
    "thoi-trang-nu-c2355.html",
    "thoi-trang-tre-em-c2363.html",
    "balo-tui-xach-c2749.html",
  ],
};

/**
 * Returns child category tuples [name, slug] from categories for parent categories.
 */
export function getSubcategoriesForCategory(slug: string): Array<readonly [string, string]> {
  const childSlugs = subcategorySlugsMap[slug] || [];
  return childSlugs.flatMap((childSlug) => {
    const item = categories.find((c) => c[1] === childSlug);
    return item ? [item] : [];
  });
}

/**
 * Deterministically tests whether a product matches a given dynamic facet.
 */
export function matchesDynamicFacet(
  product: Product,
  facetCode: string,
  optionLabel: string
): boolean {
  const optNormalized = normalizeText(optionLabel.trim());
  const nameNormalized = normalizeText(product.name);
  const brandNormalized = normalizeText(product.brand);
  const descNormalized = normalizeText(product.description || "");
  const fullText = `${nameNormalized} ${brandNormalized} ${descNormalized}`;

  if (facetCode === "filter_brand") {
    return brandNormalized === optNormalized;
  }

  if (facetCode === "filter_category") {
    const matchedCat = categories.find((c) => normalizeText(c[0]) === optNormalized);
    return product.category === optionLabel || (matchedCat ? product.category === matchedCat[1] : false);
  }

  if (facetCode === "filter_price") {
    if (optNormalized.includes("duoi 100")) return product.price < 100000;
    if (optNormalized.includes("100.000") && optNormalized.includes("300.000")) {
      return product.price >= 100000 && product.price <= 300000;
    }
    if (optNormalized.includes("300.000") && optNormalized.includes("500.000")) {
      return product.price > 300000 && product.price <= 500000;
    }
    if (optNormalized.includes("tren 500")) return product.price > 500000;
  }

  // 1. ORIGIN (Xuất xứ thương hiệu)
  if (facetCode === "filter_origin" || optNormalized.includes("xuat xu")) {
    for (const [country, brands] of Object.entries(originBrandsMap)) {
      if (normalizeText(country) === optNormalized || optNormalized.includes(normalizeText(country))) {
        if (brands.some((b) => brandNormalized.includes(normalizeText(b)))) {
          return true;
        }
      }
    }
    if (fullText.includes(optNormalized)) return true;
    return false;
  }

  // 2. SKIN TYPE (Loại da)
  if (facetCode === "filter_nari_skin_type") {
    if (optNormalized.includes("dau") || optNormalized.includes("hon hop dau")) {
      return (
        fullText.includes("dau") ||
        fullText.includes("nhon") ||
        fullText.includes("mun") ||
        fullText.includes("oil") ||
        fullText.includes("sebum") ||
        fullText.includes("lo chan long")
      );
    }
    if (optNormalized.includes("nhay cam")) {
      return (
        fullText.includes("nhay cam") ||
        fullText.includes("sensitive") ||
        fullText.includes("diu nhe") ||
        fullText.includes("khong mui") ||
        fullText.includes("phuc hoi")
      );
    }
    if (optNormalized.includes("kho") || optNormalized.includes("hon hop kho")) {
      return (
        fullText.includes("da kho") ||
        fullText.includes("kho") ||
        fullText.includes("cap nuoc") ||
        fullText.includes("am toi uu") ||
        fullText.includes("duong am")
      );
    }
    if (optNormalized.includes("mun")) {
      return (
        fullText.includes("mun") ||
        fullText.includes("acne") ||
        fullText.includes("bha") ||
        fullText.includes("tram tra")
      );
    }
    if (optNormalized.includes("moi loai da") || optNormalized.includes("da thuong")) {
      return true;
    }
  }

  // 3. USES (Công dụng chính)
  if (facetCode === "filter_nari_uses") {
    if (optNormalized.includes("duong am") || optNormalized.includes("cap nuoc")) {
      return (
        fullText.includes("duong am") ||
        fullText.includes("cap nuoc") ||
        fullText.includes("cap am") ||
        fullText.includes("am toi uu") ||
        fullText.includes("hyaluronic") ||
        fullText.includes("moist")
      );
    }
    if (optNormalized.includes("kiem soat dau") || optNormalized.includes("giam mun")) {
      return (
        fullText.includes("dau") ||
        fullText.includes("giam dau") ||
        fullText.includes("mun") ||
        fullText.includes("kiem soat") ||
        fullText.includes("lo chan long")
      );
    }
    if (optNormalized.includes("sang") || optNormalized.includes("deu mau")) {
      return (
        fullText.includes("sang") ||
        fullText.includes("trang") ||
        fullText.includes("tham") ||
        fullText.includes("vitamin c") ||
        fullText.includes("niacinamide")
      );
    }
    if (optNormalized.includes("diu") || optNormalized.includes("phuc hoi") || optNormalized.includes("tai tao")) {
      return (
        fullText.includes("diu") ||
        fullText.includes("phuc hoi") ||
        fullText.includes("rau ma") ||
        fullText.includes("b5") ||
        fullText.includes("centella") ||
        fullText.includes("panthenol")
      );
    }
    if (optNormalized.includes("lam sach") || optNormalized.includes("sach sau")) {
      return (
        fullText.includes("sach") ||
        fullText.includes("tay trang") ||
        fullText.includes("rua mat") ||
        fullText.includes("cleans")
      );
    }
    if (optNormalized.includes("chong nang") || optNormalized.includes("bao ve da")) {
      return (
        fullText.includes("chong nang") ||
        fullText.includes("spf") ||
        fullText.includes("sunscreen")
      );
    }
    if (optNormalized.includes("lao hoa") || optNormalized.includes("nhan")) {
      return (
        fullText.includes("lao hoa") ||
        fullText.includes("nhan") ||
        fullText.includes("retinol") ||
        fullText.includes("collagen")
      );
    }
  }

  // 4. STRUCTURE (Kết cấu)
  if (facetCode === "filter_nari_structure") {
    if (optNormalized.includes("kem")) {
      return fullText.includes("kem") || fullText.includes("cream");
    }
    if (optNormalized.includes("gel")) {
      return fullText.includes("gel");
    }
    if (optNormalized.includes("long") || optNormalized.includes("nuoc")) {
      return (
        fullText.includes("nuoc") ||
        fullText.includes("long") ||
        fullText.includes("toner") ||
        fullText.includes("lotion") ||
        fullText.includes("dung dich")
      );
    }
    if (optNormalized.includes("serum") || optNormalized.includes("tinh chat")) {
      return fullText.includes("serum") || fullText.includes("tinh chat") || fullText.includes("ampoule");
    }
  }

  // 5. SIZE (Dung tích)
  if (facetCode === "filter_nari_size") {
    if (optNormalized.includes("fullsize")) {
      return (
        product.price >= 120000 ||
        /\b(50|80|100|150|180|200|250|300|400|473|500)\s*(ml|g)\b/i.test(product.name)
      );
    }
    if (optNormalized.includes("combo")) {
      return (
        fullText.includes("combo") ||
        fullText.includes("bo ") ||
        fullText.includes("set") ||
        fullText.includes("2 chai") ||
        fullText.includes("2 hu")
      );
    }
    if (optNormalized.includes("1 mieng")) {
      return fullText.includes("mieng") || fullText.includes("mat na");
    }
    if (optNormalized.includes("mini") || optNormalized.includes("sample")) {
      return fullText.includes("mini") || fullText.includes("sample") || product.price < 60000;
    }
  }

  // 6. INGREDIENTS (Thành phần nổi bật)
  if (facetCode === "filter_nari_ingredient") {
    if (optNormalized.includes("rau ma")) return fullText.includes("rau ma") || fullText.includes("centella");
    if (optNormalized.includes("bha") || optNormalized.includes("salicylic")) return fullText.includes("bha") || fullText.includes("salicylic");
    if (optNormalized.includes("hyaluronic") || optNormalized.includes("ha")) return fullText.includes("hyaluronic") || fullText.includes("ha") || fullText.includes("hada labo");
    if (optNormalized.includes("niacinamide")) return fullText.includes("niacinamide");
    if (optNormalized.includes("b5") || optNormalized.includes("panthenol")) return fullText.includes("b5") || fullText.includes("panthenol");
    if (optNormalized.includes("vitamin c")) return fullText.includes("vitamin c");
  }

  const words = optNormalized
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !["cho", "cac", "danh", "dang"].includes(w));
  if (words.length > 0 && words.some((w) => fullText.includes(w))) {
    return true;
  }

  return false;
}
