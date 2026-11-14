import type { LocationSelection, ProductSummary, CampaignBanner } from "@/lib/backend-contracts";
export type { LocationSelection, ProductSummary, CampaignBanner };
import campaignsData from "../../docs/research/hasaki/campaigns-home-2026-11-13.json";

export interface ProvinceLocation {
  name: string;
  code: string;
  districts: Array<{
    name: string;
    isNowFreeEligible: boolean;
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
        isNowFreeEligible: true,
        wards: ["Phường Bến Nghé", "Phường Bến Thành", "Phường Đa Kao", "Phường Tân Định", "Phường Cầu Ông Lãnh", "Phường Phạm Ngũ Lão"],
      },
      {
        name: "Quận 3",
        isNowFreeEligible: true,
        wards: ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 4", "Phường 9", "Phường 14"],
      },
      {
        name: "Quận 5",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 4", "Phường 7", "Phường 11", "Phường 14"],
      },
      {
        name: "Quận 7",
        isNowFreeEligible: true,
        wards: ["Phường Tân Phong", "Phường Tân Quy", "Phường Phú Mỹ", "Phường Tân Phú", "Phường Bình Thuận"],
      },
      {
        name: "Quận 10",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 4", "Phường 10", "Phường 12", "Phường 14"],
      },
      {
        name: "Quận Bình Thạnh",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 15", "Phường 25", "Phường 26"],
      },
      {
        name: "Quận Tân Bình",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 4", "Phường 12", "Phường 13"],
      },
      {
        name: "TP. Thủ Đức",
        isNowFreeEligible: true,
        wards: ["Phường Thảo Điền", "Phường An Phú", "Phường Hiệp Bình Chánh", "Phường Linh Chiểu", "Phường Tăng Nhơn Phú A"],
      },
      {
        name: "Quận Phú Nhuận",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 7", "Phường 8", "Phường 15"],
      },
      {
        name: "Quận Gò Vấp",
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 3", "Phường 5", "Phường 10", "Phường 16"],
      },
      {
        name: "Huyện Bình Chánh",
        isNowFreeEligible: false,
        wards: ["Xã Bình Hưng", "Xã Vĩnh Lộc A", "Xã Vĩnh Lộc B", "Thị trấn Tân Túc"],
      },
      {
        name: "Huyện Hóc Môn",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Hàng Bạc", "Phường Hàng Đào", "Phường Tràng Tiền", "Phường Lý Thái Tổ"],
      },
      {
        name: "Quận Ba Đình",
        isNowFreeEligible: true,
        wards: ["Phường Điện Bàn", "Phường Giảng Võ", "Phường Kim Mã", "Phường Liễu Giai"],
      },
      {
        name: "Quận Cầu Giấy",
        isNowFreeEligible: true,
        wards: ["Phường Dịch Vọng", "Phường Nghĩa Tân", "Phường Quan Hoa", "Phường Yên Hòa"],
      },
      {
        name: "Quận Đống Đa",
        isNowFreeEligible: true,
        wards: ["Phường Cát Linh", "Phường Láng Hạ", "Phường Nam Đồng", "Phường Ô Chợ Dừa"],
      },
      {
        name: "Quận Hai Bà Trưng",
        isNowFreeEligible: true,
        wards: ["Phường Bách Khoa", "Phường Bạch Đằng", "Phường Minh Khai", "Phường Vĩnh Tuy"],
      },
      {
        name: "Quận Thanh Xuân",
        isNowFreeEligible: true,
        wards: ["Phường Khương Mai", "Phường Nhân Chính", "Phường Thanh Xuân Bắc"],
      },
      {
        name: "Quận Tây Hồ",
        isNowFreeEligible: true,
        wards: ["Phường Bưởi", "Phường Nhật Tân", "Phường Quảng An", "Phường Xuân La"],
      },
      {
        name: "Quận Nam Từ Liêm",
        isNowFreeEligible: true,
        wards: ["Phường Mỹ Đình 1", "Phường Mỹ Đình 2", "Phường Mễ Trì"],
      },
      {
        name: "Quận Bắc Từ Liêm",
        isNowFreeEligible: true,
        wards: ["Phường Cổ Nhuế 1", "Phường Phú Diễn", "Phường Xuân Đỉnh"],
      },
      {
        name: "Quận Hà Đông",
        isNowFreeEligible: true,
        wards: ["Phường Hà Cầu", "Phường Mộ Lao", "Phường Quang Trung", "Phường Vạn Phúc"],
      },
      {
        name: "Quận Hoàng Mai",
        isNowFreeEligible: true,
        wards: ["Phường Định Công", "Phường Giáp Bát", "Phường Hoàng Liệt"],
      },
      {
        name: "Quận Long Biên",
        isNowFreeEligible: true,
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
        isNowFreeEligible: true,
        wards: ["Phường Hải Châu 1", "Phường Thạch Thang", "Phường Thanh Bình", "Phường Hòa Cường Bắc"],
      },
      {
        name: "Quận Thanh Khê",
        isNowFreeEligible: true,
        wards: ["Phường Tam Thuận", "Phường Vĩnh Trung", "Phường Tân Chính"],
      },
      {
        name: "Quận Sơn Trà",
        isNowFreeEligible: true,
        wards: ["Phường An Hải Bắc", "Phường Phước Mỹ", "Phường Thọ Quang"],
      },
      {
        name: "Quận Ngũ Hành Sơn",
        isNowFreeEligible: true,
        wards: ["Phường Mỹ An", "Phường Khuê Mỹ"],
      },
      {
        name: "Quận Cẩm Lệ",
        isNowFreeEligible: true,
        wards: ["Phường Khuê Trung", "Phường Hòa Thọ Đông"],
      },
      {
        name: "Quận Liên Chiểu",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường An Cư", "Phường An Nghiệp", "Phường Xuân Khánh", "Phường Cái Khế"],
      },
      {
        name: "Quận Bình Thủy",
        isNowFreeEligible: true,
        wards: ["Phường Bình Thủy", "Phường An Thới", "Phường Trà Nóc"],
      },
      {
        name: "Quận Cái Răng",
        isNowFreeEligible: true,
        wards: ["Phường Lê Bình", "Phường Hưng Phú", "Phường Ba Láng"],
      },
      {
        name: "Quận Ô Môn",
        isNowFreeEligible: false,
        wards: ["Phường Châu Văn Liêm", "Phường Thới Hòa"],
      },
      {
        name: "Quận Thốt Nốt",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Hạ Lý", "Phường Hoàng Văn Thụ", "Phường Phan Bội Châu"],
      },
      {
        name: "Quận Ngô Quyền",
        isNowFreeEligible: true,
        wards: ["Phường Cầu Đất", "Phường Lạc Viên", "Phường Máy Tơ"],
      },
      {
        name: "Quận Lê Chân",
        isNowFreeEligible: true,
        wards: ["Phường An Biên", "Phường Cát Dài", "Phường Niệm Nghĩa"],
      },
      {
        name: "Quận Hải An",
        isNowFreeEligible: true,
        wards: ["Phường Đằng Hải", "Phường Đông Hải 1"],
      },
      {
        name: "Quận Kiến An",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Phú Hòa", "Phường Hiệp Thành", "Phường Chánh Nghĩa", "Phường Định Hòa"],
      },
      {
        name: "TP. Thuận An",
        isNowFreeEligible: true,
        wards: ["Phường Lái Thiêu", "Phường An Phú", "Phường Bình Hòa"],
      },
      {
        name: "TP. Dĩ An",
        isNowFreeEligible: true,
        wards: ["Phường Dĩ An", "Phường Tân Đông Hiệp", "Phường An Bình"],
      },
      {
        name: "TP. Bến Cát",
        isNowFreeEligible: false,
        wards: ["Phường Mỹ Phước", "Phường Thới Hòa"],
      },
      {
        name: "TP. Tân Uyên",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Quyết Thắng", "Phường Tân Phong", "Phường Trung Dũng", "Phường Thống Nhất"],
      },
      {
        name: "TP. Long Khánh",
        isNowFreeEligible: false,
        wards: ["Phường Xuân An", "Phường Xuân Trung"],
      },
      {
        name: "Huyện Long Thành",
        isNowFreeEligible: false,
        wards: ["Thị trấn Long Thành", "Xã An Phước"],
      },
      {
        name: "Huyện Nhơn Trạch",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Lộc Thọ", "Phường Phước Tiến", "Phường Tân Lập", "Phường Vĩnh Hải"],
      },
      {
        name: "TP. Cam Ranh",
        isNowFreeEligible: false,
        wards: ["Phường Cam Phú", "Phường Cam Thuận"],
      },
      {
        name: "Thị xã Ninh Hòa",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường 1", "Phường 2", "Phường 7", "Phường Thắng Tam", "Phường Nguyễn An Ninh"],
      },
      {
        name: "TP. Bà Rịa",
        isNowFreeEligible: true,
        wards: ["Phường Phước Trung", "Phường Phước Hưng"],
      },
      {
        name: "Thị xã Phú Mỹ",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Tân Lập", "Phường Thắng Lợi", "Phường Tự An", "Phường Tân An"],
      },
      {
        name: "Huyện Cư M'gar",
        isNowFreeEligible: false,
        wards: ["Thị trấn Quảng Phú", "Xã Ea Kpam"],
      },
      {
        name: "Huyện Krông Pắc",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Lê Mao", "Phường Trường Thi", "Phường Hưng Bình", "Phường Hà Huy Tập"],
      },
      {
        name: "Thị xã Cửa Lò",
        isNowFreeEligible: false,
        wards: ["Phường Nghi Hương", "Phường Nghi Thu"],
      },
      {
        name: "Huyện Diễn Châu",
        isNowFreeEligible: false,
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
        isNowFreeEligible: true,
        wards: ["Phường Vĩnh Ninh", "Phường Phú Nhuận", "Phường Thuận Lộc", "Phường Kim Long", "Phường Xuân Phú"],
      },
      {
        name: "Thị xã Hương Thủy",
        isNowFreeEligible: false,
        wards: ["Phường Phú Bài", "Phường Thủy Dương"],
      },
      {
        name: "Thị xã Hương Trà",
        isNowFreeEligible: false,
        wards: ["Phường Tứ Hạ", "Phường Hương Văn"],
      },
    ],
  },
];

const LOCATION_STORAGE_KEY = "hasaki-demo-location";
export const LOCATION_CHANGE_EVENT = "hasaki-location-change";

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
 * Checks whether a given province/district qualifies for Hasaki NowFree 2H fast delivery.
 */
export function isNowFreeDistrict(provinceName: string, districtName: string): boolean {
  const p = VIETNAM_LOCATIONS.find((prov) => prov.name.toLowerCase() === provinceName.toLowerCase());
  if (!p) return false;
  const d = p.districts.find((dist) => dist.name.toLowerCase() === districtName.toLowerCase());
  return !!d?.isNowFreeEligible;
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

export function getCampaignWowData(): CampaignWowData {
  const wow = campaignsData.campaignWow;
  return {
    url: wow.url,
    title: wow.title,
    description: wow.description,
    ogImage: wow.ogImage,
    banners: wow.observedImages,
    flashSlots: (wow.flashSlots as CampaignFlashSlot[]) || [],
  };
}

export function getHomeWidgetsSnapshot() {
  return campaignsData.homeWidgets;
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

export function getTagPageData(slug: string): TagPageData {
  const normalizedSlug = slug.endsWith(".html") ? slug : `${slug}.html`;
  const knownTags = campaignsData.tagPages as Record<string, TagPageData>;

  if (knownTags[normalizedSlug]) {
    return knownTags[normalizedSlug];
  }

  // Fallback for any generic tag slug
  const cleanName = slug
    .replace(/\.html$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    slug: normalizedSlug,
    url: `https://hasaki.vn/tag/${normalizedSlug}`,
    title: `${cleanName} | Hasaki.vn`,
    heading: cleanName,
    description: `Danh sách các sản phẩm và deal nổi bật theo chuyên đề ${cleanName} tại Hasaki.vn`,
    ogImage: "https://media.hasaki.vn/hsk/banner/hasaki_slogan_2020.jpg",
  };
}

// ----------------------------------------------------------------------
// Customer Portal Demo Contracts
// ----------------------------------------------------------------------

export interface CustomerMenuLink {
  key: "tai-khoan" | "don-hang" | "lich-hen" | "so-dia-chi" | "diem-thuong";
  label: string;
  href: string;
  icon: string;
}

export function getCustomerMenuLinks(): CustomerMenuLink[] {
  return [
    { key: "tai-khoan", label: "Thông tin tài khoản", href: "/khach-hang/tai-khoan", icon: "user" },
    { key: "don-hang", label: "Đơn hàng của tôi", href: "/khach-hang/don-hang", icon: "shopping-bag" },
    { key: "lich-hen", label: "Lịch hẹn Clinic & Spa", href: "/khach-hang/lich-hen", icon: "calendar" },
    { key: "so-dia-chi", label: "Sổ địa chỉ nhận hàng", href: "/khach-hang/so-dia-chi", icon: "map-pin" },
    { key: "diem-thuong", label: "Điểm thưởng Hasaki Rewards", href: "/khach-hang/diem-thuong", icon: "award" },
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
  deliveryType: "NowFree 2H" | "Tiêu chuẩn";
  shippingAddress: string;
  recipientName: string;
  recipientPhone: string;
  items: DemoOrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

export function getDemoOrderHistory(): DemoOrder[] {
  return [
    {
      id: "ord-202611-0941",
      code: "HSK-202611-0941",
      createdAt: "12/11/2026 14:32",
      status: "Đang giao hàng",
      paymentMethod: "Thanh toán khi nhận hàng (COD)",
      deliveryType: "NowFree 2H",
      shippingAddress: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
      recipientName: "Nguyễn Văn An",
      recipientPhone: "0901234567",
      items: [
        {
          sku: "422208973",
          name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu 473ml",
          brand: "CeraVe",
          price: 314000,
          quantity: 1,
          slug: "sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml-102959.html",
        },
        {
          sku: "200400003",
          name: "Nước Tẩy Trang Bioderma Dành Cho Da Nhạy Cảm 500ml",
          brand: "Bioderma",
          price: 360000,
          quantity: 1,
          slug: "nuoc-tay-trang-bioderma-danh-cho-da-nhay-cam-500ml-9740.html",
        },
      ],
      subtotal: 674000,
      shippingFee: 0,
      total: 674000,
    },
    {
      id: "ord-202610-8812",
      code: "HSK-202610-8812",
      createdAt: "28/10/2026 10:15",
      status: "Đã giao thành công",
      paymentMethod: "Chuyển khoản VNPAY-QR",
      deliveryType: "NowFree 2H",
      shippingAddress: "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh",
      recipientName: "Nguyễn Văn An",
      recipientPhone: "0901234567",
      items: [
        {
          sku: "253900006",
          name: "Kem Chống Nắng Skin1004 Cho Da Nhạy Cảm SPF 50+ 50ml",
          brand: "Skin1004",
          price: 249000,
          quantity: 2,
          slug: "kem-chong-nang-skin1004-chiet-xuat-rau-ma-spf50-pa-50ml-86167.html",
        },
      ],
      subtotal: 498000,
      shippingFee: 0,
      total: 498000,
    },
  ];
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
  return [
    {
      id: "bk-202611-192",
      code: "CLINIC-19240",
      serviceName: "Lấy Nhân Mụn Y Khoa Chuẩn Y Khoa + Điện Di Trị Thâm",
      branchName: "Hasaki Clinic Hoàng Hoa Thám",
      branchAddress: "71 Hoàng Hoa Thám, P. 13, Q. Tân Bình, TP.HCM",
      appointmentTime: "15:00 - Thứ Bảy, 15/11/2026",
      status: "Sắp tới",
      doctorAssigned: "BS. CKI Da Liễu Nguyễn Thị Mai",
      note: "Khách hàng lưu ý đến trước 10 phút để được khám soi da miễn phí",
    },
    {
      id: "bk-202610-104",
      code: "CLINIC-10482",
      serviceName: "Chăm Sóc Da Mặt Chuyên Sâu Tái Tạo Cấp Ẩm Hyaluronic Acid",
      branchName: "Hasaki Clinic 3/2",
      branchAddress: "555 Đường 3 Tháng 2, P. 8, Q. 10, TP.HCM",
      appointmentTime: "10:30 - Chủ Nhật, 26/10/2026",
      status: "Đã hoàn thành",
      doctorAssigned: "KTV. Trần Bảo Ngọc",
    },
  ];
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
    memberCode: "HSK-GOLD-88219",
    points: 420,
    tier: "Gold",
    nextTierPoints: 500,
    pointsExpiringSoon: 50,
    expiryDate: "31/12/2026",
    benefits: [
      "Tích lũy 3% giá trị mọi đơn hàng mỹ phẩm & dịch vụ Clinic",
      "Miễn phí vận chuyển NowFree 2H không giới hạn đơn từ 99K",
      "Tặng Voucher 100.000₫ và quà sinh nhật độc quyền trong tháng sinh nhật",
      "Ưu tiên đặt hẹn bác sĩ da liễu tại toàn bộ hệ thống Hasaki Clinic",
      "Đặc quyền tham gia các đợt Siêu Sale Private Sale trước 24H",
    ],
    recentTransactions: [
      {
        date: "12/11/2026",
        description: "Tích điểm đơn hàng HSK-202611-0941",
        pointsChange: +20,
        type: "earn",
      },
      {
        date: "28/10/2026",
        description: "Tích điểm đơn hàng HSK-202610-8812",
        pointsChange: +15,
        type: "earn",
      },
      {
        date: "26/10/2026",
        description: "Tích điểm dịch vụ Hasaki Clinic CLINIC-10482",
        pointsChange: +35,
        type: "earn",
      },
      {
        date: "15/09/2026",
        description: "Đổi điểm nhận Voucher Giảm 50K",
        pointsChange: -100,
        type: "redeem",
      },
    ],
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
    fullName: "Nguyễn Văn An",
    phone: "0901234567",
    email: "nguyenvanan.demo@hasaki.vn",
    gender: "Nam",
    birthday: "1995-08-15",
    joinedDate: "15/03/2023",
  };
}
