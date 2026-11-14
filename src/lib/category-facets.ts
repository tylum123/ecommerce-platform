import type { FacetGroup, FacetOption } from "@/lib/backend-contracts";
import { categories, type Product } from "@/lib/catalog";
import facetsRaw from "../../docs/research/hasaki/category-facets-2026-11-13.json";

interface RawFacetOption {
  key: string | number;
  label: string;
  count?: number;
}

interface RawFacetGroup {
  code: string;
  name: string;
  options: RawFacetOption[];
}

const facetsMap = facetsRaw as Record<string, RawFacetGroup[] | undefined>;

const excludedCodes = new Set(["filter_brand", "filter_category"]);

const facetPriority: Record<string, number> = {
  filter_hsk_skin_type: 1, // Loại da
  filter_hsk_uses: 2, // Công dụng chính
  filter_origin: 3, // Xuất xứ thương hiệu
  filter_hsk_structure: 4, // Kết cấu
  filter_hsk_size: 5, // Dung tích
  filter_hsk_ingredient: 6, // Thành phần nổi bật
  filter_hsk_skin_problem: 7, // Vấn đề về da
  filter_hsk_product_type: 8, // Loại sản phẩm
  filter_dac_tinh: 9, // Đặc tính
  filter_sex: 10, // Giới tính
  filter_hsk_tones: 11, // Màu sắc
  filter_hsk_product_line: 12, // Dòng sản phẩm
};

/**
 * Returns the scraped facet groups for a category slug, excluding duplicate
 * Brand and Category groups which are rendered as dedicated sections.
 * Falls back to cham-soc-da-mat-c4.html when the requested category has no facets.
 */
export function getCategoryFacets(slug: string): FacetGroup[] {
  const rawList = facetsMap[slug] && facetsMap[slug]!.length > 0
    ? facetsMap[slug]!
    : facetsMap["cham-soc-da-mat-c4.html"] || [];

  const filtered = rawList.filter(group => {
    if (excludedCodes.has(group.code)) return false;
    const nameLower = group.name.toLowerCase();
    if (nameLower.includes("thương hiệu") || nameLower === "danh mục") return false;
    return Array.isArray(group.options) && group.options.length > 0;
  });

  // Sort groups by priority so key groups (Loại da, Công dụng, Xuất xứ, Kết cấu) appear first
  filtered.sort((a, b) => {
    const pA = facetPriority[a.code] ?? 99;
    const pB = facetPriority[b.code] ?? 99;
    return pA - pB;
  });

  return filtered.map(group => {
    const options: FacetOption[] = group.options.map(opt => ({
      label: opt.label.replace(/&amp;/g, "&"),
      value: opt.key,
      count: opt.count ?? 0,
    }));
    return {
      key: group.code,
      name: group.name,
      options,
    };
  });
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
  return childSlugs.flatMap(childSlug => {
    const item = categories.find(c => c[1] === childSlug);
    return item ? [item] : [];
  });
}

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

  // 1. ORIGIN (Xuất xứ thương hiệu)
  if (facetCode === "filter_origin" || optNormalized.includes("xuat xu")) {
    for (const [country, brands] of Object.entries(originBrandsMap)) {
      if (normalizeText(country) === optNormalized || optNormalized.includes(normalizeText(country))) {
        if (brands.some(b => brandNormalized.includes(normalizeText(b)))) {
          return true;
        }
      }
    }
    if (fullText.includes(optNormalized)) return true;
    return false;
  }

  // 2. SKIN TYPE (Loại da)
  if (facetCode === "filter_hsk_skin_type") {
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
      // General skincare items typically suit normal/all skin
      return true;
    }
  }

  // 3. USES (Công dụng chính)
  if (facetCode === "filter_hsk_uses") {
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
  if (facetCode === "filter_hsk_structure") {
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
  if (facetCode === "filter_hsk_size") {
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
  if (facetCode === "filter_hsk_ingredient") {
    if (optNormalized.includes("rau ma")) return fullText.includes("rau ma") || fullText.includes("centella");
    if (optNormalized.includes("bha") || optNormalized.includes("salicylic")) return fullText.includes("bha") || fullText.includes("salicylic");
    if (optNormalized.includes("hyaluronic") || optNormalized.includes("ha")) return fullText.includes("hyaluronic") || fullText.includes("ha") || fullText.includes("hada labo");
    if (optNormalized.includes("niacinamide")) return fullText.includes("niacinamide");
    if (optNormalized.includes("b5") || optNormalized.includes("panthenol")) return fullText.includes("b5") || fullText.includes("panthenol");
    if (optNormalized.includes("vitamin c")) return fullText.includes("vitamin c");
  }

  // Fallback: match any significant words (length >= 3) from optionLabel against product text
  const words = optNormalized.split(/\s+/).filter(w => w.length >= 3 && !["cho", "cac", "danh", "dang"].includes(w));
  if (words.length > 0 && words.some(w => fullText.includes(w))) {
    return true;
  }

  return false;
}
