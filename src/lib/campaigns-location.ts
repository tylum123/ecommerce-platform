import type { LocationSelection, ProductSummary, CampaignBanner } from "@/lib/backend-contracts";
export type { LocationSelection, ProductSummary, CampaignBanner };
import { BRAND_CONFIG } from "@/lib/brand-config";

export interface ProvinceLocation {
  name: string;
  code: string;
  districts: Array<{
    name: string;
    isNariNowEligible: boolean;
    wards: string[];
  }>;
}

export const VIETNAM_LOCATIONS: ProvinceLocation[] = [
  {
    name: "Hồ Chí Minh",
    code: "HCM",
    districts: [
      {
        name: "Quận 1",
        isNariNowEligible: true,
        wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Tân Định", "Phường Cầu Ông Lãnh", "Phường Phạm Ngũ Lão"],
      },
      {
        name: "Quận 3",
        isNariNowEligible: true,
        wards: ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 4", "Phường 9", "Phường 14"],
      },
      {
        name: "Quận 5",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 4", "Phường 7", "Phường 11", "Phường 14"],
      },
      {
        name: "Quận 7",
        isNariNowEligible: true,
        wards: ["Phường Tân Phong", "Phường Tân Quy", "Phường Phú Mỹ", "Phường Tân Phú", "Phường Bình Thuận"],
      },
      {
        name: "Quận 10",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 4", "Phường 10", "Phường 12", "Phường 14"],
      },
      {
        name: "Quận Bình Thạnh",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 15", "Phường 25", "Phường 26"],
      },
      {
        name: "Quận Tân Bình",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 12", "Phường 13"],
      },
      {
        name: "TP. Thủ Đức",
        isNariNowEligible: true,
        wards: ["Phường Thảo Điền", "Phường An Phú", "Phường Hiệp Bình Chánh", "Phường Linh Chiểu", "Phường Tăng Nhơn Phú A"],
      },
      {
        name: "Quận Phú Nhuận",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 7", "Phường 8", "Phường 15"],
      },
      {
        name: "Quận Gò Vấp",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 3", "Phường 5", "Phường 10", "Phường 16"],
      },
      {
        name: "Huyện Bình Chánh",
        isNariNowEligible: false,
        wards: ["Xã Bình Hưng", "Xã Vĩnh Lộc A", "Xã Vĩnh Lộc B", "Thị trấn Tân Túc"],
      },
      {
        name: "Huyện Hóc Môn",
        isNariNowEligible: false,
        wards: ["Thị trấn Hóc Môn", "Xã Bà Điểm", "Xã Xuân Thới Thượng"],
      },
    ],
  },
  {
    name: "Hà Nội",
    code: "HN",
    districts: [
      {
        name: "Quận Hoàn Kiếm",
        isNariNowEligible: true,
        wards: ["Phường Hàng Bạc", "Phường Hàng Đào", "Phường Tràng Tiền", "Phường Lý Thái Tổ"],
      },
      {
        name: "Quận Ba Đình",
        isNariNowEligible: true,
        wards: ["Phường Điện Bàn", "Phường Giảng Võ", "Phường Kim Mã", "Phường Liễu Giai"],
      },
      {
        name: "Quận Cầu Giấy",
        isNariNowEligible: true,
        wards: ["Phường Dịch Vọng", "Phường Nghĩa Tân", "Phường Quan Hoa", "Phường Yên Hòa"],
      },
      {
        name: "Quận Đống Đa",
        isNariNowEligible: true,
        wards: ["Phường Cát Linh", "Phường Láng Hạ", "Phường Nam Đồng", "Phường Ô Chợ Dừa"],
      },
      {
        name: "Quận Hai Bà Trưng",
        isNariNowEligible: true,
        wards: ["Phường Bách Khoa", "Phường Bạch Đằng", "Phường Minh Khai", "Phường Vĩnh Tuy"],
      },
      {
        name: "Quận Thanh Xuân",
        isNariNowEligible: true,
        wards: ["Phường Khương Mai", "Phường Nhân Chính", "Phường Thanh Xuân Bắc"],
      },
      {
        name: "Quận Tây Hồ",
        isNariNowEligible: true,
        wards: ["Phường Bưởi", "Phường Nhật Tân", "Phường Quảng An", "Phường Xuân La"],
      },
      {
        name: "Quận Nam Từ Liêm",
        isNariNowEligible: true,
        wards: ["Phường Mỹ Đình 1", "Phường Mỹ Đình 2", "Phường Mễ Trì"],
      },
      {
        name: "Quận Bắc Từ Liêm",
        isNariNowEligible: true,
        wards: ["Phường Cổ Nhuế 1", "Phường Phú Diễn", "Phường Xuân Đỉnh"],
      },
      {
        name: "Quận Hà Đông",
        isNariNowEligible: true,
        wards: ["Phường Hà Cầu", "Phường Mộ Lao", "Phường Quang Trung", "Phường Vạn Phúc"],
      },
      {
        name: "Quận Hoàng Mai",
        isNariNowEligible: true,
        wards: ["Phường Định Công", "Phường Giáp Bát", "Phường Hoàng Liệt"],
      },
      {
        name: "Quận Long Biên",
        isNariNowEligible: true,
        wards: ["Phường Bồ Đề", "Phường Gia Thụy", "Phường Ngọc Lâm"],
      },
    ],
  },
  {
    name: "Đà Nẵng",
    code: "DN",
    districts: [
      {
        name: "Quận Hải Châu",
        isNariNowEligible: true,
        wards: ["Phường Hải Châu 1", "Phường Thạch Thang", "Phường Thanh Bình", "Phường Hòa Cường Bắc"],
      },
      {
        name: "Quận Thanh Khê",
        isNariNowEligible: true,
        wards: ["Phường Tam Thuận", "Phường Vĩnh Trung", "Phường Tân Chính"],
      },
      {
        name: "Quận Sơn Trà",
        isNariNowEligible: true,
        wards: ["Phường An Hải Bắc", "Phường Phước Mỹ", "Phường Thọ Quang"],
      },
      {
        name: "Quận Ngũ Hành Sơn",
        isNariNowEligible: true,
        wards: ["Phường Mỹ An", "Phường Khuê Mỹ"],
      },
      {
        name: "Quận Cẩm Lệ",
        isNariNowEligible: true,
        wards: ["Phường Khuê Trung", "Phường Hòa Thọ Đông"],
      },
      {
        name: "Quận Liên Chiểu",
        isNariNowEligible: false,
        wards: ["Phường Hòa Khánh Bắc", "Phường Hòa Minh"],
      },
    ],
  },
  {
    name: "Cần Thơ",
    code: "CT",
    districts: [
      {
        name: "Quận Ninh Kiều",
        isNariNowEligible: true,
        wards: ["Phường An Cư", "Phường An Nghiệp", "Phường Xuân Khánh", "Phường Cái Khế"],
      },
      {
        name: "Quận Bình Thủy",
        isNariNowEligible: true,
        wards: ["Phường Bình Thủy", "Phường An Thới", "Phường Trà Nóc"],
      },
      {
        name: "Quận Cái Răng",
        isNariNowEligible: true,
        wards: ["Phường Lê Bình", "Phường Hưng Phú", "Phường Ba Láng"],
      },
      {
        name: "Quận Ô Môn",
        isNariNowEligible: false,
        wards: ["Phường Châu Văn Liêm", "Phường Thới Hòa"],
      },
      {
        name: "Quận Thốt Nốt",
        isNariNowEligible: false,
        wards: ["Phường Thốt Nốt", "Phường Thuận An"],
      },
    ],
  },
  {
    name: "Hải Phòng",
    code: "HP",
    districts: [
      {
        name: "Quận Hồng Bàng",
        isNariNowEligible: true,
        wards: ["Phường Hạ Lý", "Phường Hoàng Văn Thụ", "Phường Phan Bội Châu"],
      },
      {
        name: "Quận Ngô Quyền",
        isNariNowEligible: true,
        wards: ["Phường Cầu Đất", "Phường Lạc Viên", "Phường Máy Tơ"],
      },
      {
        name: "Quận Lê Chân",
        isNariNowEligible: true,
        wards: ["Phường An Biên", "Phường Cát Dài", "Phường Niệm Nghĩa"],
      },
      {
        name: "Quận Hải An",
        isNariNowEligible: true,
        wards: ["Phường Đằng Hải", "Phường Đông Hải 1"],
      },
      {
        name: "Quận Kiến An",
        isNariNowEligible: false,
        wards: ["Phường Bắc Sơn", "Phường Quán Trữ"],
      },
    ],
  },
  {
    name: "Bình Dương",
    code: "BD",
    districts: [
      {
        name: "TP. Thủ Dầu Một",
        isNariNowEligible: true,
        wards: ["Phường Phú Hòa", "Phường Hiệp Thành", "Phường Chánh Nghĩa", "Phường Định Hòa"],
      },
      {
        name: "TP. Thuận An",
        isNariNowEligible: true,
        wards: ["Phường Lái Thiêu", "Phường An Phú", "Phường Bình Hòa"],
      },
      {
        name: "TP. Dĩ An",
        isNariNowEligible: true,
        wards: ["Phường Dĩ An", "Phường Tân Đông Hiệp", "Phường An Bình"],
      },
      {
        name: "TP. Bến Cát",
        isNariNowEligible: false,
        wards: ["Phường Mỹ Phước", "Phường Thới Hòa"],
      },
      {
        name: "TP. Tân Uyên",
        isNariNowEligible: false,
        wards: ["Phường Uyên Hưng", "Phường Tân Hiệp"],
      },
    ],
  },
  {
    name: "Đồng Nai",
    code: "DN_AI",
    districts: [
      {
        name: "TP. Biên Hòa",
        isNariNowEligible: true,
        wards: ["Phường Quyết Thắng", "Phường Tân Phong", "Phường Trung Dũng", "Phường Thống Nhất"],
      },
      {
        name: "TP. Long Khánh",
        isNariNowEligible: false,
        wards: ["Phường Xuân An", "Phường Xuân Trung"],
      },
      {
        name: "Huyện Long Thành",
        isNariNowEligible: false,
        wards: ["Thị trấn Long Thành", "Xã An Phước"],
      },
      {
        name: "Huyện Nhơn Trạch",
        isNariNowEligible: false,
        wards: ["Xã Hiệp Phước", "Xã Phước Thiền"],
      },
    ],
  },
  {
    name: "Khánh Hòa",
    code: "KH",
    districts: [
      {
        name: "TP. Nha Trang",
        isNariNowEligible: true,
        wards: ["Phường Lộc Thọ", "Phường Phước Tiến", "Phường Tân Lập", "Phường Vĩnh Hải"],
      },
      {
        name: "TP. Cam Ranh",
        isNariNowEligible: false,
        wards: ["Phường Cam Phú", "Phường Cam Thuận"],
      },
      {
        name: "Thị xã Ninh Hòa",
        isNariNowEligible: false,
        wards: ["Phường Ninh Hiệp", "Xã Ninh Quang"],
      },
    ],
  },
  {
    name: "Bà Rịa - Vũng Tàu",
    code: "BRVT",
    districts: [
      {
        name: "TP. Vũng Tàu",
        isNariNowEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 7", "Phường Thắng Tam", "Phường Nguyễn An Ninh"],
      },
      {
        name: "TP. Bà Rịa",
        isNariNowEligible: true,
        wards: ["Phường Phước Trung", "Phường Phước Hưng"],
      },
      {
        name: "Thị xã Phú Mỹ",
        isNariNowEligible: false,
        wards: ["Phường Phú Mỹ", "Phường Mỹ Xuân"],
      },
    ],
  },
  {
    name: "Đắk Lắk",
    code: "DL",
    districts: [
      {
        name: "TP. Buôn Ma Thuột",
        isNariNowEligible: true,
        wards: ["Phường Tân Lập", "Phường Thắng Lợi", "Phường Tự An", "Phường Tân An"],
      },
      {
        name: "Huyện Cư M'gar",
        isNariNowEligible: false,
        wards: ["Thị trấn Quảng Phú", "Xã Ea Kpam"],
      },
      {
        name: "Huyện Krông Pắc",
        isNariNowEligible: false,
        wards: ["Thị trấn Phước An", "Xã Ea Yông"],
      },
    ],
  },
  {
    name: "Nghệ An",
    code: "NA",
    districts: [
      {
        name: "TP. Vinh",
        isNariNowEligible: true,
        wards: ["Phường Lê Mao", "Phường Trường Thi", "Phường Hưng Bình", "Phường Hà Huy Tập"],
      },
      {
        name: "Thị xã Cửa Lò",
        isNariNowEligible: false,
        wards: ["Phường Nghi Hương", "Phường Nghi Thu"],
      },
      {
        name: "Huyện Diễn Châu",
        isNariNowEligible: false,
        wards: ["Thị trấn Diễn Châu", "Xã Diễn Thành"],
      },
    ],
  },
  {
    name: "Thừa Thiên Huế",
    code: "HUE",
    districts: [
      {
        name: "TP. Huế",
        isNariNowEligible: true,
        wards: ["Phường Vĩnh Ninh", "Phường Phú Nhuận", "Phường Thuận Lộc", "Phường Kim Long", "Phường Xuân Phú"],
      },
      {
        name: "Thị xã Hương Thủy",
        isNariNowEligible: false,
        wards: ["Phường Phú Bài", "Phường Thủy Dương"],
      },
      {
        name: "Thị xã Hương Trà",
        isNariNowEligible: false,
        wards: ["Phường Tứ Hạ", "Phường Hương Văn"],
      },
    ],
  },
];

const LOCATION_STORAGE_KEY = "nari-location";
export const LOCATION_CHANGE_EVENT = "nari-location-change";

/**
 * Reads user's selected location from localStorage.
 */
export function readLocation(): LocationSelection | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.province === "string") {
      return {
        province: parsed.province,
        district: parsed.district ?? "",
        ward: parsed.ward ?? "",
        updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Saves location to localStorage and notifies subscribers across the app.
 */
export function saveLocation(loc: LocationSelection): void {
  if (typeof window === "undefined") return;
  const payload: LocationSelection = {
    province: loc.province.trim(),
    district: (loc.district || "").trim(),
    ward: (loc.ward || "").trim(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: payload }));
}

/**
 * Clears selected location from localStorage.
 */
export function clearLocation(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCATION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT, { detail: null }));
}

/**
 * Formats location string for topbar / header badge display.
 */
export function formatLocationShort(loc: LocationSelection | null): string {
  if (!loc || !loc.province) return "Chọn khu vực của bạn";
  if (loc.ward && loc.district) {
    return `${loc.ward}, ${loc.district}, ${loc.province}`;
  }
  if (loc.district) {
    return `${loc.district}, ${loc.province}`;
  }
  return loc.province;
}

/**
 * Checks whether a given province/district qualifies for Nari Home NariNow 2H fast delivery.
 */
export function isNariNowDistrict(provinceName: string, districtName: string): boolean {
  const p = VIETNAM_LOCATIONS.find((prov) => prov.name.toLowerCase() === provinceName.toLowerCase());
  if (!p) return false;
  const d = p.districts.find((dist) => dist.name.toLowerCase() === districtName.toLowerCase());
  return !!d?.isNariNowEligible;
}

// ----------------------------------------------------------------------
// Campaign & Home Widgets Data Getters
// ----------------------------------------------------------------------

export interface CampaignFlashSlot {
  id: string;
  time: string;
  label: string;
  status: "active" | "upcoming";
  badge: string;
}

export interface CampaignWowData {
  url: string;
  title: string;
  description: string;
  ogImage: string;
  banners: Array<{ src: string; alt: string }>;
  flashSlots: CampaignFlashSlot[];
}

export interface TagPageData {
  slug: string;
  url: string;
  title: string;
  heading: string;
  description: string;
  ogImage: string;
  observedImages?: Array<{ src: string; alt?: string }>;
}

export const CAMPAIGN_WOW_DATA: CampaignWowData = {
  url: `https://${BRAND_CONFIG.domain}/campaign/wow`,
  title: `Khuyến Mãi Mỹ Phẩm Giá Tốt, Ưu Đãi Khủng | ${BRAND_CONFIG.name}`,
  description: `Top Deal Mỹ Phẩm, tổng hợp chương trình khuyến mãi mỹ phẩm giá tốt. Săn Deals Mỹ Phẩm Ưu Đãi Lớn Tại ${BRAND_CONFIG.name}`,
  ogImage: "/nari-home-banner.jpg",
  banners: [],
  flashSlots: [
    {
      id: "slot-09",
      time: "09:00 - 12:00",
      label: "Đang diễn ra",
      status: "active",
      badge: "Deal Sốc Nửa Giá",
    },
    {
      id: "slot-12",
      time: "12:00 - 18:00",
      label: "Sắp diễn ra",
      status: "upcoming",
      badge: "Freeship 2H",
    },
    {
      id: "slot-18",
      time: "18:00 - 22:00",
      label: "Sắp diễn ra",
      status: "upcoming",
      badge: "Mua 1 Tặng 1",
    },
    {
      id: "slot-22",
      time: "22:00 - 24:00",
      label: "Khung giờ đêm",
      status: "upcoming",
      badge: "Giảm Thêm 50K",
    },
  ],
};

export const KNOWN_TAG_PAGES: Record<string, TagPageData> = {
  "dai-tiec-hang-hieu.html": {
    slug: "dai-tiec-hang-hieu.html",
    url: `https://${BRAND_CONFIG.domain}/tag/dai-tiec-hang-hieu.html`,
    title: `Đại Tiệc Hàng Hiệu | ${BRAND_CONFIG.name}`,
    heading: "Đại Tiệc Hàng Hiệu - Sản Phẩm Cao Cấp",
    description:
      "Đại Tiệc Hàng Hiệu - Tuyển chọn mỹ phẩm và sản phẩm làm đẹp cao cấp chính hãng từ các thương hiệu hàng đầu thế giới với ưu đãi hấp dẫn.",
    ogImage: "/nari-home-banner.jpg",
    observedImages: [],
  },
  "deal-for-men.html": {
    slug: "deal-for-men.html",
    url: `https://${BRAND_CONFIG.domain}/tag/deal-for-men.html`,
    title: `Deal For Men - Sản Phẩm Phái Mạnh | ${BRAND_CONFIG.name}`,
    heading: "Deal For Men - Chăm Sóc Toàn Diện Phái Mạnh",
    description:
      "Bộ sưu tập sản phẩm chăm sóc da mặt, cơ thể và tóc chuyên biệt dành riêng cho nam giới từ các thương hiệu uy tín.",
    ogImage: "/nari-home-banner.jpg",
    observedImages: [],
  },
};

export function getCampaignWowData(): CampaignWowData {
  return CAMPAIGN_WOW_DATA;
}

export function getHomeWidgetsSnapshot() {
  return {
    heroBanners: [] as Array<{ id: string; title: string; image: string; href: string }>,
    rightBanners: [] as Array<{ id: string; title: string; image: string; href: string }>,
    shortcuts: [] as Array<{ id: string; name: string; icon: string; url: string }>,
    subBanners: [] as Array<{ id: string; title: string; image: string; href: string }>,
    flashDeal: {
      title: "Flash deals",
      titleColorHex: "#ffffff",
      backgroundColor: "#FF8E4D",
      countdown: 0,
      url: "/deals-dang-dien-ra.html",
      products: [] as Array<Record<string, unknown>>,
    },
    featuredCategories: [] as Array<{ name: string; image: string; url: string }>,
    featuredBrands: {
      title: "Thương hiệu",
      banners: [] as Array<{ id: string; title: string; image: string; href: string }>,
      brands: [] as Array<{ name: string; image: string; logo: string; url: string }>,
    },
    topSales: [] as Array<{ image: string; url: string; totalSold: string }>,
  };
}

export function getTagPageData(slug: string): TagPageData {
  const normalizedSlug = slug.endsWith(".html") ? slug : `${slug}.html`;

  if (Object.hasOwn(KNOWN_TAG_PAGES, normalizedSlug)) {
    return KNOWN_TAG_PAGES[normalizedSlug];
  }

  const cleanName = slug
    .replace(/\.html$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    slug: normalizedSlug,
    url: `https://${BRAND_CONFIG.domain}/tag/${normalizedSlug}`,
    title: `${cleanName} | ${BRAND_CONFIG.name}`,
    heading: cleanName,
    description: `Danh sách các sản phẩm và deal nổi bật theo chuyên đề ${cleanName} tại ${BRAND_CONFIG.name}`,
    ogImage: "/nari-home-banner.jpg",
  };
}

// ----------------------------------------------------------------------
// Customer Portal Contracts
// ----------------------------------------------------------------------

export interface CustomerMenuLink {
  key:
    | "tai-khoan"
    | "don-hang"
    | "lich-hen"
    | "so-dia-chi"
    | "uu-dai"
    | "yeu-thich"
    | "hoi-dap"
    | "diem-thuong";
  label: string;
  href: string;
  icon: string;
}

export function getCustomerMenuLinks(): CustomerMenuLink[] {
  return [
    { key: "tai-khoan", label: "Thông tin tài khoản", href: "/khach-hang/tai-khoan", icon: "user" },
    { key: "don-hang", label: "Đơn hàng của tôi", href: "/khach-hang/don-hang", icon: "shopping-bag" },
    { key: "lich-hen", label: `Lịch hẹn ${BRAND_CONFIG.shortName} Clinic`, href: "/khach-hang/lich-hen", icon: "calendar" },
    { key: "so-dia-chi", label: "Sổ địa chỉ nhận hàng", href: "/khach-hang/so-dia-chi", icon: "map-pin" },
    { key: "uu-dai", label: "Mã giảm giá & Khuyến mãi", href: "/khach-hang/uu-dai", icon: "tag" },
    { key: "yeu-thich", label: "Sản phẩm yêu thích", href: "/khach-hang/yeu-thich", icon: "heart" },
    { key: "hoi-dap", label: "Hỏi đáp & Trợ giúp", href: "/khach-hang/hoi-dap", icon: "help-circle" },
    { key: "diem-thuong", label: `Điểm thưởng ${BRAND_CONFIG.loyaltyName}`, href: "/khach-hang/diem-thuong", icon: "award" },
  ];
}

export interface DemoOrderItem {
  sku: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  slug: string;
}

export interface DemoOrder {
  id: string;
  code: string;
  createdAt: string;
  status: "Đang giao hàng" | "Đã giao thành công" | "Chờ xác nhận" | "Đã hủy";
  paymentMethod: string;
  deliveryType: string;
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  items: DemoOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

export function getDemoOrderHistory(): DemoOrder[] {
  return [];
}

export interface DemoBooking {
  id: string;
  code: string;
  serviceName: string;
  branchName: string;
  branchAddress: string;
  appointmentTime: string;
  status: "Sắp tới" | "Đã hoàn thành" | "Đã hủy";
  doctorAssigned?: string;
  note?: string;
}

export function getDemoBookingHistory(): DemoBooking[] {
  return [];
}

export interface DemoLoyaltySummary {
  memberCode: string;
  points: number;
  tier: "Silver" | "Gold" | "Diamond";
  nextTierPoints: number;
  pointsExpiringSoon: number;
  expiryDate: string;
  benefits: string[];
  recentTransactions: Array<{
    date: string;
    description: string;
    pointsChange: number;
    type: "earn" | "redeem";
  }>;
}

export function getDemoLoyaltySummary(): DemoLoyaltySummary {
  return {
    memberCode: "",
    points: 0,
    tier: "Silver",
    nextTierPoints: 500,
    pointsExpiringSoon: 0,
    expiryDate: "",
    benefits: [],
    recentTransactions: [],
  };
}

export interface DemoUserProfile {
  fullName: string;
  phone: string;
  email: string;
  gender: "Nam" | "Nữ" | "Khác";
  birthday: string;
  avatarUrl?: string;
  joinedDate: string;
}

export function getDemoUserProfile(): DemoUserProfile {
  return {
    fullName: "",
    phone: "",
    email: "",
    gender: "Khác",
    birthday: "",
    joinedDate: "",
  };
}
