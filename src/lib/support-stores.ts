/**
 * Support, Store Locator, Warranty & Footer service module.
 * Backend-ready contract adapters indexed by CodeGraph.
 */

import type { StoreBranchInfo, SupportTopic } from "@/lib/backend-contracts";
export type { StoreBranchInfo, SupportTopic };
import rawSupportFooterData from "../../docs/research/hasaki/support-footer-2026-11-13.json";
import { brandDeep } from "@/lib/brand-config";

const supportFooterData = brandDeep(rawSupportFooterData);

export interface WarrantyPolicySection {
  title: string;
  period: string;
  coverage: string[];
  conditions: string[];
  brands: string[];
}

export interface WarrantyPolicyData {
  title: string;
  hotline: string;
  policySummary: string;
  generalTerms: string[];
  categories: WarrantyPolicySection[];
  processSteps: Array<{
    step: number;
    title: string;
    description: string;
  }>;
}

export interface WarrantyLookupResult {
  found: boolean;
  query: string;
  customerName?: string;
  phone?: string;
  serialNumber?: string;
  productName?: string;
  brand?: string;
  purchaseDate?: string;
  warrantyExpireDate?: string;
  warrantyStatus?: "active" | "expired" | "processing";
  branchName?: string;
  message: string;
}

export interface FooterLinkItem {
  name: string;
  href: string;
  isExternal?: boolean;
}

export interface FooterColumn {
  title: string;
  links: FooterLinkItem[];
}

export interface FooterData {
  hotline: {
    shopping: string;
    clinic: string;
    hours: string;
    email: string;
  };
  benefits: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  columns: FooterColumn[];
  topKeywords: Array<{
    name: string;
    url: string;
  }>;
  companyInfo: {
    name: string;
    license: string;
    address: string;
    copyright: string;
  };
}

// ----------------------------------------------------------------------
// Store Locator Services
// ----------------------------------------------------------------------

const defaultBranches: StoreBranchInfo[] = [
  {
    id: "3",
    name: "Nari Home Beauty & Clinic Hoàng Hoa Thám",
    address: "71 Hoàng Hoa Thám, P.Tân Bình, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận Tân Bình",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://Nari Home/images/71-Hoang-Hoa-Tham.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+71+Ho%C3%A0ng+Hoa+Th%C3%A1m"
  },
  {
    id: "5",
    name: "Nari Home Beauty & Clinic Đường 3 Tháng 2",
    address: "555 Đường 3 Tháng 2, P.Diên Hồng, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 10",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://Nari Home/images/555-bathanghai.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+555+Du%CC%9Bong+3+Thang+2"
  },
  {
    id: "7",
    name: "Nari Home Beauty & Clinic Phan Đăng Lưu",
    address: "176 Phan Đăng Lưu, P.4, Q.Phú Nhuận, TP.HCM",
    city: "Hồ Chí Minh",
    district: "Quận Phú Nhuận",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://Nari Home/images/176-Phandangluu.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+176+Phan+Dang+Luu"
  },
  {
    id: "9",
    name: "Nari Home Beauty & Clinic Lê Văn Việt",
    address: "94 Lê Văn Việt, P.Tăng Nhơn Phú, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "TP. Thủ Đức",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://Nari Home/images/graphics/cuahang-4.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+94+Le+Van+Viet"
  },
  {
    id: "11",
    name: "Nari Home Beauty & Clinic Nguyễn Gia Trí",
    address: "119-121 Nguyễn Gia Trí (D2 cũ), P.Thạnh Mỹ Tây, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận Bình Thạnh",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN5.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+119+Nguyen+Gia+Tri"
  },
  {
    id: "16",
    name: "Nari Home Beauty & Clinic Quang Trung",
    address: "657B Quang Trung, P.Thông Tây Hội, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận Gò Vấp",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://Nari Home/images/graphics/cuahang-6.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+657B+Quang+Trung"
  },
  {
    id: "19",
    name: "Nari Home Beauty & Clinic Nguyễn Thị Thập",
    address: "468A Nguyễn Thị Thập, P.Tân Hưng, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 7",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/468NTT.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+468A+Nguyen+Thi+Thap"
  },
  {
    id: "23",
    name: "Nari Home Beauty & Clinic Nguyễn Ảnh Thủ",
    address: "6M-6M1 Nguyễn Ảnh Thủ, P.Trung Mỹ Tây, Thành phố Hồ Chí Minh",
    city: "Hồ Chí Minh",
    district: "Quận 12",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN-9-6M-6M1-Nguyen-Anh-Thu-Trung-My-Tay-%20Q12-TPHCM.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Nguyen+Anh+Thu"
  },
  {
    id: "677",
    name: "Nari Home Beauty & Clinic Nguyễn Trãi",
    address: "185 - 187 - 189 Nguyễn Trãi, P.Chợ Quán (Cũ: P2, Q.5), TP.HCM",
    city: "Hồ Chí Minh",
    district: "Quận 5",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN185-Nguyen-Trai.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+185+Nguyen+Trai"
  },
  {
    id: "625",
    name: "Nari Home Beauty & Clinic Hai Bà Trưng Q3",
    address: "189A-189B Hai Bà Trưng, P.Võ Thị Sáu, Q.3, TP.HCM",
    city: "Hồ Chí Minh",
    district: "Quận 3",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN254.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+189A+Hai+Ba+Trung"
  },
  {
    id: "779",
    name: "Nari Home Beauty & Clinic Tân Hương",
    address: "161-163 Tân Hương, P. Phú Thọ Hòa, TP. HCM",
    city: "Hồ Chí Minh",
    district: "Quận Tân Phú",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/1777954991931-cn-161-tan-huong-1777955050.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+161+Tan+Huong"
  },
  {
    id: "793",
    name: "Nari Home Beauty & Clinic Bờ Bao Tân Thắng",
    address: "103E-103F Bờ Bao Tân Thắng, P. Tân Sơn Nhì, TP. HCM",
    city: "Hồ Chí Minh",
    district: "Quận Tân Phú",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/cn-103-bo-bao-tan-thang-1781521194.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Bo+Bao+Tan+Thang"
  },
  {
    id: "631",
    name: "Nari Home Beauty & Clinic Cầu Giấy",
    address: "321 - 323 Cầu Giấy, P.Cầu Giấy, Thành phố Hà Nội",
    city: "Hà Nội",
    district: "Quận Cầu Giấy",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN-Cau-Giay.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+321+Cau+Giay"
  },
  {
    id: "632",
    name: "Nari Home Beauty Hàng Bông",
    address: "182 Hàng Bông, Phường Hàng Bông, Quận Hoàn Kiếm, Hà Nội",
    city: "Hà Nội",
    district: "Quận Hoàn Kiếm",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: false,
    image: "https://Nari Home/images/graphics/cuahang-4.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+182+Hang+Bong+Ha+Noi"
  },
  {
    id: "633",
    name: "Nari Home Beauty Chùa Bộc",
    address: "235 Chùa Bộc, Phường Trung Liệt, Quận Đống Đa, Hà Nội",
    city: "Hà Nội",
    district: "Quận Đống Đa",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: false,
    image: "https://Nari Home/images/graphics/cuahang-6.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+235+Chua+Boc+Ha+Noi"
  },
  {
    id: "121",
    name: "Nari Home Beauty & Clinic Lê Duẩn Đà Nẵng",
    address: "393 Lê Duẩn, P.Chính Gián, Q.Thanh Khê, Đà Nẵng",
    city: "Đà Nẵng",
    district: "Quận Thanh Khê",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/CN51-Thanh-ke-da-nang.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+393+Le+Duan+Da+Nang"
  },
  {
    id: "93",
    name: "Nari Home Beauty & Clinic Đường 30 Tháng 4 Cần Thơ",
    address: "189-197 đường 30 Tháng 4, P.Ninh Kiều, Thành phố Cần Thơ",
    city: "Cần Thơ",
    district: "Quận Ninh Kiều",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/189-197-30-4.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+189+30+Thang+4+Can+Tho"
  },
  {
    id: "81",
    name: "Nari Home Beauty & Clinic Phạm Văn Thuận Biên Hòa",
    address: "1519-1521 Phạm Văn Thuận, P.Trấn Biên, TP. Biên Hòa, Tỉnh Đồng Nai",
    city: "Đồng Nai",
    district: "TP. Biên Hòa",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/1519-PVT.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+1519+Pham+Van+Thuan+Dong+Nai"
  },
  {
    id: "97",
    name: "Nari Home Beauty & Clinic Yersin Bình Dương",
    address: "219 Yersin, Phường Phú Cường, TP. Thủ Dầu Một, Tỉnh Bình Dương",
    city: "Bình Dương",
    district: "TP. Thủ Dầu Một",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/219-YS.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+219+Yersin+Binh+Duong"
  },
  {
    id: "91",
    name: "Nari Home Beauty & Clinic Ba Cu Vũng Tàu",
    address: "177 Ba Cu, Phường 4, TP. Vũng Tàu, Tỉnh Bà Rịa - Vũng Tàu",
    city: "Bà Rịa - Vũng Tàu",
    district: "TP. Vũng Tàu",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/177-BC.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+177+Ba+Cu+Vung+Tau"
  },
  {
    id: "141",
    name: "Nari Home Beauty & Clinic Hai Bà Trưng Đà Lạt",
    address: "1-3 Hai Bà Trưng, Phường 6, TP. Đà Lạt, Tỉnh Lâm Đồng",
    city: "Lâm Đồng",
    district: "TP. Đà Lạt",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: true,
    image: "https://media.hcdn.vn/hsk/store/cn-61-da-lat-1762167061.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Hai+Ba+Trung+Da+Lat"
  },
  {
    id: "142",
    name: "Nari Home Beauty Trần Phú Nha Trang",
    address: "88 Trần Phú, Phường Lộc Thọ, TP. Nha Trang, Tỉnh Khánh Hòa",
    city: "Khánh Hòa",
    district: "TP. Nha Trang",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: false,
    image: "https://Nari Home/images/graphics/cuahang-4.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Nha+Trang"
  },
  {
    id: "143",
    name: "Nari Home Beauty Hùng Vương Huế",
    address: "124 Hùng Vương, Phường Phú Nhuận, Thành phố Huế, Tỉnh Thừa Thiên Huế",
    city: "Thừa Thiên Huế",
    district: "TP. Huế",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: false,
    image: "https://Nari Home/images/graphics/cuahang-6.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Hue"
  },
  {
    id: "144",
    name: "Nari Home Beauty Lạch Tray Hải Phòng",
    address: "246 Lạch Tray, Quận Ngô Quyền, Thành phố Hải Phòng",
    city: "Hải Phòng",
    district: "Quận Ngô Quyền",
    phone: "1800 6324",
    hours: "08:00 - 22:00 (Mỗi ngày kể cả T7, CN)",
    hasClinic: false,
    image: "https://media.hcdn.vn/hsk/store/CN5.jpg",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Nari Home+Hai+Phong"
  }
];

export function getStoreBranches(): StoreBranchInfo[] {
  return defaultBranches;
}

export function getStoreCities(): string[] {
  const cities = Array.from(new Set(defaultBranches.map(b => b.city)));
  return ["Tất cả Tỉnh/Thành", ...cities];
}

export function getStoreDistricts(city?: string): string[] {
  if (!city || city === "Tất cả Tỉnh/Thành") {
    const districts = Array.from(new Set(defaultBranches.map(b => b.district)));
    return ["Tất cả Quận/Huyện", ...districts];
  }
  const filtered = defaultBranches.filter(b => b.city.toLowerCase() === city.toLowerCase());
  const districts = Array.from(new Set(filtered.map(b => b.district)));
  return ["Tất cả Quận/Huyện", ...districts];
}

export function filterStoreBranches(options: {
  city?: string;
  district?: string;
  hasClinic?: boolean;
  query?: string;
}): StoreBranchInfo[] {
  return defaultBranches.filter(branch => {
    if (options.city && options.city !== "Tất cả Tỉnh/Thành") {
      if (branch.city.toLowerCase() !== options.city.toLowerCase()) {
        return false;
      }
    }
    if (options.district && options.district !== "Tất cả Quận/Huyện") {
      if (branch.district.toLowerCase() !== options.district.toLowerCase()) {
        return false;
      }
    }
    if (options.hasClinic && !branch.hasClinic) {
      return false;
    }
    if (options.query && options.query.trim()) {
      const q = options.query.toLowerCase().trim();
      const matchName = branch.name.toLowerCase().includes(q);
      const matchAddress = branch.address.toLowerCase().includes(q);
      const matchCity = branch.city.toLowerCase().includes(q);
      const matchDistrict = branch.district.toLowerCase().includes(q);
      if (!matchName && !matchAddress && !matchCity && !matchDistrict) {
        return false;
      }
    }
    return true;
  });
}

// ----------------------------------------------------------------------
// Support Topic & FAQ Services
// ----------------------------------------------------------------------

const supportTopics: SupportTopic[] = supportFooterData.topics as SupportTopic[];

export function getSupportCategories(): string[] {
  const categories = Array.from(new Set(supportTopics.map(t => t.category)));
  return categories;
}

export function getSupportTopics(): SupportTopic[] {
  return supportTopics;
}

export function getSupportTopicBySlug(slug: string): SupportTopic | undefined {
  return supportTopics.find(t => t.slug === slug);
}

export function searchSupportTopics(query: string): SupportTopic[] {
  if (!query || !query.trim()) return supportTopics;
  const q = query.toLowerCase().trim();
  return supportTopics.filter(t => 
    t.title.toLowerCase().includes(q) ||
    t.summary.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    t.sections.some(s => s.heading.toLowerCase().includes(q) || s.body.some(b => b.toLowerCase().includes(q)))
  );
}

// ----------------------------------------------------------------------
// Warranty Policy & Lookup Services
// ----------------------------------------------------------------------

const warrantyPolicyData: WarrantyPolicyData = {
  title: "Trung Tâm Bảo Hành & Chính Sách Hậu Mãi Nari Home",
  hotline: "1800 6324 (Phím 1 hoặc gửi yêu cầu online)",
  policySummary: "Nari Home cam kết phân phối 100% hàng chính hãng, đầy đủ hóa đơn chứng từ VAT và tem phụ tiếng Việt. Tất cả sản phẩm thiết bị làm đẹp, phụ kiện điện tử và đồ gia dụng do Nari Home phân phối đều được hưởng chế độ bảo hành chính hãng từ nhà sản xuất hoặc trung tâm bảo hành ủy quyền.",
  generalTerms: [
    "Thời hạn bảo hành được tính từ ngày xuất hóa đơn mua hàng thành công tại Nari Home.",
    "Khách hàng có thể mang máy đến trực tiếp bất kỳ chi nhánh Nari Home nào trên toàn quốc hoặc gửi qua bưu điện/chuyển phát nhanh.",
    "Sản phẩm bảo hành cần có hóa đơn mua hàng / số điện thoại đặt hàng hoặc tem bảo hành, số Serial còn nguyên vẹn.",
    "Lỗi kỹ thuật từ nhà sản xuất trong vòng 30 ngày đầu được áp dụng chính sách 1 đổi 1 miễn phí."
  ],
  categories: [
    {
      title: "Thiết bị làm đẹp & Chăm sóc cá nhân",
      period: "12 – 24 tháng (tùy theo nhãn hàng)",
      brands: ["Halio", "Foreo", "Panasonic", "Philips", "Emmié by Happy Skin"],
      coverage: [
        "Máy rửa mặt, máy đẩy tinh chất dưỡng da, máy massage mặt và mắt.",
        "Máy sấy tóc ion, máy uốn/duỗi tóc tạo kiểu chuyên nghiệp.",
        "Lỗi không lên nguồn, pin không nhận sạc, lỗi motor rung, lỗi sóng rung siêu âm."
      ],
      conditions: [
        "Thân máy không có dấu hiệu nứt vỡ, cạy mở, biến dạng do va đập hoặc ngâm nước ngoài chuẩn kháng nước quy định.",
        "Sản phẩm còn nguyên số Serial hoặc tem bảo hành chính hãng."
      ]
    },
    {
      title: "Phụ kiện điện tử, Củ sạc & Cáp sạc",
      period: "12 – 18 tháng (1 đổi 1)",
      brands: ["Anker", "Ugreen", "Baseus", "Energizer", "JBL"],
      coverage: [
        "Củ sạc nhanh GaN, pin sạc dự phòng, cáp sạc USB-C / Lightning, tai nghe.",
        "Lỗi không vào điện, ngắt sạc bất thường, không kích hoạt sạc nhanh chuẩn PD/QC."
      ],
      conditions: [
        "Cáp không bị đứt gãy lõi dây, chân tiếp xúc không bị rỉ sét do hóa chất hoặc cháy chập ngoại vi.",
        "Củ sạc còn nguyên vẹn tem bảo hành và vỏ ngoài."
      ]
    },
    {
      title: "Đồ gia dụng & Thiết bị thông minh",
      period: "12 – 24 tháng chính hãng",
      brands: ["Havatek", "Philips", "Gaabor", "BlueStone", "LocknLock"],
      coverage: [
        "Nồi chiên không dầu, ấm đun nước, máy lọc không khí mini, bàn ủi hơi nước.",
        "Lỗi mâm nhiệt, bo mạch điều khiển điện tử, quạt hút tản nhiệt."
      ],
      conditions: [
        "Sử dụng đúng điện áp quy định (220V), không can thiệp sửa chữa tại bên thứ ba chưa được cấp phép."
      ]
    }
  ],
  processSteps: [
    {
      step: 1,
      title: "Đăng ký yêu cầu bảo hành",
      description: "Nhập số điện thoại hoặc mã đơn hàng/Serial tại trang Tra cứu bảo hành hoặc liên hệ hotline 1800 6324."
    },
    {
      step: 2,
      title: "Tiếp nhận và kiểm định thiết bị",
      description: "Gửi sản phẩm tại cửa hàng Nari Home gần nhất hoặc gửi qua chuyển phát bưu điện về Trung tâm bảo hành."
    },
    {
      step: 3,
      title: "Xử lý bảo hành / Đổi mới",
      description: "Kỹ thuật viên hãng kiểm tra, xử lý trong 3 - 7 ngày làm việc và gửi trả tận tay khách hàng."
    }
  ]
};

export function getWarrantyPolicyData(): WarrantyPolicyData {
  return warrantyPolicyData;
}

export function lookupWarrantyDraft(query: string): WarrantyLookupResult {
  return {
    found: false,
    query: query.trim(),
    message: "Chưa kết nối dữ liệu bảo hành đã xác minh. Không thể xác nhận bảo hành; vui lòng liên hệ trực tiếp Nari Home.",
  };
}

// ----------------------------------------------------------------------
// Footer Data Service
// ----------------------------------------------------------------------

export function getFooterData(): FooterData {
  return {
    hotline: supportFooterData.hotline,
    benefits: [
      {
        title: "Thanh toán khi nhận hàng",
        description: "Kiểm tra hàng trước khi thanh toán COD",
        icon: "CreditCard"
      },
      {
        title: "Giao nhanh miễn phí 2H",
        description: "NariNow áp dụng đơn từ 90K tại TP.HCM & Cần Thơ",
        icon: "Truck"
      },
      {
        title: "30 ngày đổi trả miễn phí",
        description: "Đổi trả tận tâm nếu lỗi kỹ thuật từ nhà sản xuất",
        icon: "RotateCcw"
      },
      {
        title: "Thương hiệu uy tín toàn cầu",
        description: "100% chính hãng, đền 200% nếu phát hiện hàng giả",
        icon: "ShieldCheck"
      }
    ],
    columns: [
      {
        title: "HỖ TRỢ KHÁCH HÀNG",
        links: [
          { name: "Hotline CSKH: 1800 6324 (Miễn phí)", href: "tel:18006324" },
          { name: "Hệ thống 350+ cửa hàng toàn quốc", href: "/he-thong-cua-hang" },
          { name: "Trung tâm bảo hành Nari Home", href: "/bao-hanh" },
          { name: "Trung tâm hỗ trợ & FAQ", href: "/ho-tro" },
          { name: "Hướng dẫn đặt hàng", href: "/ho-tro/huong-dan-dat-hang" },
          { name: "Giao nhanh 2H (NariNow)", href: "/ho-tro/giao-nhanh-2h" },
          { name: "Phương thức thanh toán", href: "/ho-tro/phuong-thuc-thanh-toan" },
          { name: "Chính sách đổi trả 30 ngày", href: "/ho-tro/chinh-sach-doi-tra" }
        ]
      },
      {
        title: "VỀ NARI HOME",
        links: [
          { name: "Giới thiệu Nari Home", href: "/ho-tro/gioi-thieu" },
          { name: "Chính sách bảo mật thông tin", href: "/ho-tro/chinh-sach-bao-mat" },
          { name: "Điều khoản sử dụng", href: "/ho-tro/dieu-khoan-su-dung" },
          { name: "Thông tin liên hệ & Văn phòng", href: "/ho-tro/lien-he" },
          { name: "Câu hỏi thường gặp về OTP", href: "/ho-tro/ma-xac-thuc-otp" },
          { name: "Tài khoản thành viên", href: "/ho-tro/tai-khoan" }
        ]
      },
      {
        title: "HỢP TÁC & DỊCH VỤ",
        links: [
          { name: "Nari Clinic & Spa", href: "/clinic" },
          { name: "Đặt hẹn khám da Clinic", href: "/booking" },
          { name: "Dermahair Chuyên sâu", href: "/danh-muc/dermahair-c2298.html" },
          { name: "Tra cứu hệ thống chi nhánh", href: "/he-thong-cua-hang" },
          { name: "Tra cứu kích hoạt bảo hành", href: "/bao-hanh" }
        ]
      },
      {
        title: "KẾT NỐI VỚI NARI HOME",
        links: [
          { name: "Hotline: 1800 6324 (Phím 1)", href: "tel:18006324" },
          { name: "Đặt lịch Clinic: 1800 6324 (Phím 2)", href: "tel:18006324" },
          { name: "Tải ứng dụng Nari Home App (Android / iOS)", href: "https://hotro.Nari Home/app", isExternal: true },
          { name: "Fanpage Nari Home Beauty & Clinic", href: "https://www.facebook.com/Nari Home", isExternal: true },
          { name: "Kênh Nari Clinic & Spa", href: "https://www.facebook.com/hasakiclinic", isExternal: true }
        ]
      }
    ],
    topKeywords: [
      { name: "Kem Chống Nắng", url: "/danh-muc/chong-nang-da-mat-c11.html" },
      { name: "Nước Tẩy Trang", url: "/danh-muc/tay-trang-mat-c48.html" },
      { name: "Kem Dưỡng Ẩm", url: "/danh-muc/kem-duong-dau-duong-c9.html" },
      { name: "Sữa Rửa Mặt", url: "/danh-muc/sua-rua-mat-c19.html" },
      { name: "Bông Tẩy Trang", url: "/danh-muc/khan-bong-tay-trang-c47.html" },
      { name: "Mặt Nạ", url: "/danh-muc/mat-na-c30.html" },
      { name: "Son Môi", url: "/danh-muc/son-moi-c277.html" },
      { name: "La Roche-Posay", url: "/thuong-hieu/la-roche-posay.html" },
      { name: "Bioderma", url: "/thuong-hieu/bioderma.html" },
      { name: "CeraVe", url: "/thuong-hieu/cerave.html" },
      { name: "Anker", url: "/thuong-hieu/anker.html" }
    ],
    companyInfo: {
      name: "CÔNG TY CỔ PHẦN NARI HOME BEAUTY & CLINIC",
      license: "Giấy chứng nhận ĐKKD số 0313612829 do Sở Kế hoạch và Đầu tư TP.HCM cấp ngày 13/01/2016",
      address: "Trụ sở chính: 71 Hoàng Hoa Thám, Phường Tân Bình, Thành phố Hồ Chí Minh",
      copyright: "Bản quyền © 2016 - 2026 Nari Home. Bản dựng tham khảo giao diện Next.js App Router."
    }
  };
}
