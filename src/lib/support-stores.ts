/**
 * Support, Store Locator, Warranty & Footer service module.
 * Store branches derive from PostgreSQL data when supplied; returns [] cleanly when absent.
 */

import type { StoreBranchInfo, SupportTopic } from "@/lib/backend-contracts";
export type { StoreBranchInfo, SupportTopic };

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

export function getStoreBranches(branches: StoreBranchInfo[] = []): StoreBranchInfo[] {
  return branches;
}

export function getStoreCities(branches: StoreBranchInfo[] = []): string[] {
  const cities = Array.from(new Set(branches.map((b) => b.city)));
  return ["Tất cả Tỉnh/Thành", ...cities];
}

export function getStoreDistricts(city?: string, branches: StoreBranchInfo[] = []): string[] {
  if (!city || city === "Tất cả Tỉnh/Thành") {
    const districts = Array.from(new Set(branches.map((b) => b.district)));
    return ["Tất cả Quận/Huyện", ...districts];
  }
  const filtered = branches.filter((b) => b.city.toLowerCase() === city.toLowerCase());
  const districts = Array.from(new Set(filtered.map((b) => b.district)));
  return ["Tất cả Quận/Huyện", ...districts];
}

export function filterStoreBranches(
  options: {
    city?: string;
    district?: string;
    query?: string;
  },
  branches: StoreBranchInfo[] = []
): StoreBranchInfo[] {
  return branches.filter((branch) => {
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

const supportTopics: SupportTopic[] = [
  {
    slug: "huong-dan-dat-hang",
    title: "Hướng dẫn đặt hàng tại Nari Home",
    category: "Mua hàng & Giao nhanh 2H",
    summary:
      "Quy trình tìm kiếm sản phẩm, thêm vào giỏ hàng, kiểm tra ưu đãi và hoàn tất thông tin nhận hàng tại Nari Home.",
    sourceUrl: "https://narihome.io.vn/ho-tro/huong-dan-dat-hang",
    sections: [
      {
        heading: "Bước 1: Tìm kiếm và chọn sản phẩm",
        body: [
          "Sử dụng thanh tìm kiếm hoặc danh mục sản phẩm để chọn mặt hàng mong muốn.",
          "Kiểm tra giá, thông số, dung tích và nhấn Thêm vào giỏ hàng hoặc Mua ngay.",
        ],
      },
      {
        heading: "Bước 2: Kiểm tra giỏ hàng và địa chỉ nhận hàng",
        body: [
          "Điền đầy đủ họ tên, số điện thoại 10 chữ số và địa chỉ tỉnh/thành, quận/huyện, phường/xã.",
          "Chọn phương thức thanh toán (COD khi nhận hàng hoặc thanh toán trực tuyến) và xác nhận đơn.",
        ],
      },
    ],
  },
  {
    slug: "giao-nhanh-2h",
    title: "Chính sách Giao nhanh miễn phí 2H (NariNow)",
    category: "Mua hàng & Giao nhanh 2H",
    summary:
      "Dịch vụ giao hàng nhanh trong 2 giờ áp dụng cho đơn từ 90.000đ tại các khu vực có hệ thống cửa hàng Nari Home.",
    sourceUrl: "https://narihome.io.vn/ho-tro/giao-nhanh-2h",
    sections: [
      {
        heading: "Điều kiện áp dụng NariNow 2H",
        body: [
          "Áp dụng cho đơn hàng từ 90.000đ trở lên tại các quận/huyện nội thành có chi nhánh Nari Home.",
          "Khung giờ đặt hàng từ 08:00 - 18:00 sẽ được giao trong vòng 2 giờ cùng ngày.",
        ],
      },
      {
        heading: "Cam kết giao đúng hẹn",
        body: [
          "Trường hợp trễ hẹn ngoài lý do bất khả kháng, khách hàng được tặng phiếu mua hàng 100.000đ theo quy định của Nari Home.",
        ],
      },
    ],
  },
  {
    slug: "phuong-thuc-thanh-toan",
    title: "Phương thức thanh toán",
    category: "Thanh toán & Đổi trả",
    summary:
      "Nari Home hỗ trợ đa dạng hình thức thanh toán an toàn: COD tiền mặt, chuyển khoản VietQR, VNPAY, MoMo và thẻ ngân hàng.",
    sourceUrl: "https://narihome.io.vn/ho-tro/phuong-thuc-thanh-toan",
    sections: [
      {
        heading: "Thanh toán khi nhận hàng (COD)",
        body: [
          "Khách hàng được kiểm tra ngoại quan kiện hàng trước khi thanh toán cho nhân viên giao vận.",
        ],
      },
      {
        heading: "Thanh toán trực tuyến an toàn",
        body: [
          "Hỗ trợ quét mã VietQR, ví điện tử và thẻ ATM/Visa/Mastercard với xác thực bảo mật.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-doi-tra",
    title: "Chính sách đổi trả trong 30 ngày",
    category: "Thanh toán & Đổi trả",
    summary:
      "Cam kết hỗ trợ đổi trả miễn phí trong vòng 30 ngày đối với sản phẩm lỗi từ nhà sản xuất hoặc giao nhầm.",
    sourceUrl: "https://narihome.io.vn/ho-tro/chinh-sach-doi-tra",
    sections: [
      {
        heading: "Điều kiện đổi trả",
        body: [
          "Sản phẩm còn nguyên tem mác, hóa đơn mua hàng và chưa qua sử dụng (ngoại trừ trường hợp lỗi kỹ thuật/kích ứng theo xác nhận chuyên môn).",
        ],
      },
      {
        heading: "Hình thức tiếp nhận",
        body: [
          "Quý khách có thể mang trực tiếp đến hệ thống cửa hàng Nari Home hoặc liên hệ hotline 1800 6324 để được thu hồi tận nơi.",
        ],
      },
    ],
  },
  {
    slug: "tai-khoan",
    title: "Hướng dẫn đăng ký và quản lý tài khoản",
    category: "Tài khoản & OTP",
    summary:
      "Đăng ký thành viên Nari Home để tích điểm Nari Rewards, theo dõi đơn hàng và quản lý sổ địa chỉ nhận hàng.",
    sourceUrl: "https://narihome.io.vn/ho-tro/tai-khoan",
    sections: [
      {
        heading: "Quyền lợi thành viên Nari Rewards",
        body: [
          "Tích điểm trên mọi hóa đơn mua sắm mỹ phẩm chính hãng tại Nari Home.",
          "Nhận ưu đãi sinh nhật và miễn phí vận chuyển theo hạng thành viên.",
        ],
      },
    ],
  },
  {
    slug: "ma-xac-thuc-otp",
    title: "Câu hỏi thường gặp về mã xác thực OTP",
    category: "Tài khoản & OTP",
    summary:
      "Giải đáp các tình huống khi nhận mã xác thực OTP qua SMS hoặc email khi đăng nhập và đặt hàng.",
    sourceUrl: "https://narihome.io.vn/ho-tro/ma-xac-thuc-otp",
    sections: [
      {
        heading: "Không nhận được mã OTP",
        body: [
          "Kiểm tra lại sóng điện thoại hoặc hộp thư rác (Spam), sau đó chọn gửi lại mã sau 60 giây.",
          "Liên hệ tổng đài 1800 6324 nếu vẫn gặp sự cố xác thực.",
        ],
      },
    ],
  },
  {
    slug: "gioi-thieu",
    title: "Giới thiệu Nari Home — Chất lượng thật, Giá trị thật",
    category: "Giới thiệu & Liên hệ",
    summary:
      "Nari Home phân phối mỹ phẩm và sản phẩm chăm sóc sắc đẹp chính hãng 100% trên toàn quốc.",
    sourceUrl: "https://narihome.io.vn/ho-tro/gioi-thieu",
    sections: [
      {
        heading: "Sứ mệnh & Cam kết chính hãng",
        body: [
          "Nari Home cam kết 100% sản phẩm có nguồn gốc xuất xứ rõ ràng, đầy đủ tem phụ tiếng Việt và hóa đơn VAT.",
          "Đền bù 200% giá trị đơn hàng nếu phát hiện hàng không chính hãng.",
        ],
      },
    ],
  },
  {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật thông tin khách hàng",
    category: "Chính sách & Bảo mật",
    summary:
      "Quy định về thu thập, lưu trữ, mã hóa và bảo vệ dữ liệu cá nhân của khách hàng tại Nari Home.",
    sourceUrl: "https://narihome.io.vn/ho-tro/chinh-sach-bao-mat",
    sections: [
      {
        heading: "Phạm vi bảo vệ dữ liệu",
        body: [
          "Thông tin cá nhân, địa chỉ giao hàng và lịch sử đơn hàng được bảo mật tuyệt đối và chỉ phục vụ xử lý đơn hàng, bảo hành và chăm sóc khách hàng.",
        ],
      },
    ],
  },
  {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng và quy định giao dịch chung",
    category: "Chính sách & Bảo mật",
    summary:
      "Các điều khoản chung áp dụng khi mua sắm sản phẩm trực tuyến trên hệ thống Nari Home.",
    sourceUrl: "https://narihome.io.vn/ho-tro/dieu-khoan-su-dung",
    sections: [
      {
        heading: "Quy định giao dịch",
        body: [
          "Giá niêm yết trên website đã bao gồm thuế VAT theo quy định hiện hành.",
          "Mọi khiếu nại phát sinh được tiếp nhận và giải quyết minh bạch qua tổng đài CSKH.",
        ],
      },
    ],
  },
  {
    slug: "lien-he",
    title: "Thông tin liên hệ & Tổng đài tư vấn",
    category: "Giới thiệu & Liên hệ",
    summary:
      "Kênh liên hệ trực tiếp với bộ phận Chăm sóc khách hàng Nari Home hoạt động từ 08:00 - 22:00 mỗi ngày.",
    sourceUrl: "https://narihome.io.vn/ho-tro/lien-he",
    sections: [
      {
        heading: "Tổng đài miễn cước",
        body: [
          "Tư vấn mua hàng & khiếu nại: 1800 6324 (Miễn phí).",
          "Email hỗ trợ: hotro@narihome.io.vn.",
        ],
      },
    ],
  },
];

export function getSupportCategories(): string[] {
  return Array.from(new Set(supportTopics.map((t) => t.category)));
}

export function getSupportTopics(): SupportTopic[] {
  return supportTopics;
}

export function getSupportTopicBySlug(slug: string): SupportTopic | undefined {
  return supportTopics.find((t) => t.slug === slug);
}

export function searchSupportTopics(query: string): SupportTopic[] {
  if (!query || !query.trim()) return supportTopics;
  const q = query.toLowerCase().trim();
  return supportTopics.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.sections.some(
        (s) => s.heading.toLowerCase().includes(q) || s.body.some((b) => b.toLowerCase().includes(q))
      )
  );
}

// ----------------------------------------------------------------------
// Warranty Policy & Lookup Services
// ----------------------------------------------------------------------

const warrantyPolicyData: WarrantyPolicyData = {
  title: "Trung Tâm Bảo Hành & Chính Sách Hậu Mãi Nari Home",
  hotline: "1800 6324 (Phím 1 hoặc gửi yêu cầu online)",
  policySummary:
    "Nari Home cam kết phân phối 100% hàng chính hãng, đầy đủ hóa đơn chứng từ VAT và tem phụ tiếng Việt. Tất cả sản phẩm thiết bị làm đẹp, phụ kiện điện tử và đồ gia dụng do Nari Home phân phối đều được hưởng chế độ bảo hành chính hãng từ nhà sản xuất hoặc trung tâm bảo hành ủy quyền.",
  generalTerms: [
    "Thời hạn bảo hành được tính từ ngày xuất hóa đơn mua hàng thành công tại Nari Home.",
    "Khách hàng có thể mang máy đến trực tiếp bất kỳ chi nhánh Nari Home nào trên toàn quốc hoặc gửi qua bưu điện/chuyển phát nhanh.",
    "Sản phẩm bảo hành cần có hóa đơn mua hàng / số điện thoại đặt hàng hoặc tem bảo hành, số Serial còn nguyên vẹn.",
    "Lỗi kỹ thuật từ nhà sản xuất trong vòng 30 ngày đầu được áp dụng chính sách 1 đổi 1 miễn phí.",
  ],
  categories: [
    {
      title: "Thiết bị làm đẹp & Chăm sóc cá nhân",
      period: "12 – 24 tháng (tùy theo nhãn hàng)",
      brands: ["Halio", "Foreo", "Panasonic", "Philips", "Emmié by Happy Skin"],
      coverage: [
        "Máy rửa mặt, máy đẩy tinh chất dưỡng da, máy massage mặt và mắt.",
        "Máy sấy tóc ion, máy uốn/duỗi tóc tạo kiểu chuyên nghiệp.",
        "Lỗi không lên nguồn, pin không nhận sạc, lỗi motor rung, lỗi sóng rung siêu âm.",
      ],
      conditions: [
        "Thân máy không có dấu hiệu nứt vỡ, cạy mở, biến dạng do va đập hoặc ngâm nước ngoài chuẩn kháng nước quy định.",
        "Sản phẩm còn nguyên số Serial hoặc tem bảo hành chính hãng.",
      ],
    },
    {
      title: "Phụ kiện điện tử, Củ sạc & Cáp sạc",
      period: "12 – 18 tháng (1 đổi 1)",
      brands: ["Anker", "Ugreen", "Baseus", "Energizer", "JBL"],
      coverage: [
        "Củ sạc nhanh GaN, pin sạc dự phòng, cáp sạc USB-C / Lightning, tai nghe.",
        "Lỗi không vào điện, ngắt sạc bất thường, không kích hoạt sạc nhanh chuẩn PD/QC.",
      ],
      conditions: [
        "Cáp không bị đứt gãy lõi dây, chân tiếp xúc không bị rỉ sét do hóa chất hoặc cháy chập ngoại vi.",
        "Củ sạc còn nguyên vẹn tem bảo hành và vỏ ngoài.",
      ],
    },
    {
      title: "Đồ gia dụng & Thiết bị thông minh",
      period: "12 – 24 tháng chính hãng",
      brands: ["Havatek", "Philips", "Gaabor", "BlueStone", "LocknLock"],
      coverage: [
        "Nồi chiên không dầu, ấm đun nước, máy lọc không khí mini, bàn ủi hơi nước.",
        "Lỗi mâm nhiệt, bo mạch điều khiển điện tử, quạt hút tản nhiệt.",
      ],
      conditions: [
        "Sử dụng đúng điện áp quy định (220V), không can thiệp sửa chữa tại bên thứ ba chưa được cấp phép.",
      ],
    },
  ],
  processSteps: [
    {
      step: 1,
      title: "Đăng ký yêu cầu bảo hành",
      description:
        "Nhập số điện thoại hoặc mã đơn hàng/Serial tại trang Tra cứu bảo hành hoặc liên hệ hotline 1800 6324.",
    },
    {
      step: 2,
      title: "Tiếp nhận và kiểm định thiết bị",
      description:
        "Gửi sản phẩm tại cửa hàng Nari Home gần nhất hoặc gửi qua chuyển phát bưu điện về Trung tâm bảo hành.",
    },
    {
      step: 3,
      title: "Xử lý bảo hành / Đổi mới",
      description:
        "Kỹ thuật viên hãng kiểm tra, xử lý trong 3 - 7 ngày làm việc và gửi trả tận tay khách hàng.",
    },
  ],
};

export function getWarrantyPolicyData(): WarrantyPolicyData {
  return warrantyPolicyData;
}

export function lookupWarrantyDraft(query: string): WarrantyLookupResult {
  return {
    found: false,
    query: query.trim(),
    message:
      "Chưa kết nối dữ liệu bảo hành đã xác minh. Không thể xác nhận bảo hành; vui lòng liên hệ trực tiếp Nari Home.",
  };
}

// ----------------------------------------------------------------------
// Footer Data Service
// ----------------------------------------------------------------------

export function getFooterData(): FooterData {
  return {
    hotline: {
      shopping: "1800 6324 (Miễn phí)",
      hours: "08:00 - 22:00 mỗi ngày",
      email: "hotro@narihome.io.vn",
    },
    benefits: [
      {
        title: "Thanh toán khi nhận hàng",
        description: "Kiểm tra hàng trước khi thanh toán COD",
        icon: "CreditCard",
      },
      {
        title: "Giao nhanh miễn phí 2H",
        description: "NariNow áp dụng đơn từ 90K tại nội thành",
        icon: "Truck",
      },
      {
        title: "30 ngày đổi trả miễn phí",
        description: "Đổi trả tận tâm nếu lỗi kỹ thuật từ nhà sản xuất",
        icon: "RotateCcw",
      },
      {
        title: "Thương hiệu uy tín toàn cầu",
        description: "100% chính hãng, đền 200% nếu phát hiện hàng giả",
        icon: "ShieldCheck",
      },
    ],
    columns: [
      {
        title: "HỖ TRỢ KHÁCH HÀNG",
        links: [
          { name: "Hotline CSKH: 1800 6324 (Miễn phí)", href: "tel:18006324" },
          { name: "Hệ thống cửa hàng toàn quốc", href: "/he-thong-cua-hang" },
          { name: "Trung tâm bảo hành Nari Home", href: "/bao-hanh" },
          { name: "Trung tâm hỗ trợ & FAQ", href: "/ho-tro" },
          { name: "Hướng dẫn đặt hàng", href: "/ho-tro/huong-dan-dat-hang" },
          { name: "Giao nhanh 2H (NariNow)", href: "/ho-tro/giao-nhanh-2h" },
          { name: "Phương thức thanh toán", href: "/ho-tro/phuong-thuc-thanh-toan" },
          { name: "Chính sách đổi trả 30 ngày", href: "/ho-tro/chinh-sach-doi-tra" },
        ],
      },
      {
        title: "VỀ NARI HOME",
        links: [
          { name: "Giới thiệu Nari Home", href: "/gioi-thieu" },
          { name: "Chính sách bảo mật thông tin", href: "/ho-tro/chinh-sach-bao-mat" },
          { name: "Điều khoản sử dụng", href: "/ho-tro/dieu-khoan-su-dung" },
          { name: "Thông tin liên hệ & Văn phòng", href: "/ho-tro/lien-he" },
          { name: "Câu hỏi thường gặp về OTP", href: "/ho-tro/ma-xac-thuc-otp" },
          { name: "Tài khoản thành viên", href: "/ho-tro/tai-khoan" },
        ],
      },
      {
        title: "HỢP TÁC & DỊCH VỤ",
        links: [
          { name: "Chăm sóc da mặt", href: "/danh-muc/cham-soc-da-mat-c4.html" },
          { name: "Tra cứu hệ thống chi nhánh", href: "/he-thong-cua-hang" },
          { name: "Tra cứu kích hoạt bảo hành", href: "/bao-hanh" },
          { name: "Tra cứu đơn hàng", href: "/tra-cuu-don-hang" },
        ],
      },
      {
        title: "KẾT NỐI VỚI NARI HOME",
        links: [
          { name: "Hotline CSKH: 1800 6324", href: "tel:18006324" },
          { name: "Trung tâm hỗ trợ trực tuyến", href: "/ho-tro" },
          { name: "Fanpage Nari Home", href: "https://www.facebook.com/narihome.vn", isExternal: true },
        ],
      },
    ],
    topKeywords: [
      { name: "Chăm Sóc Da Mặt", url: "/danh-muc/cham-soc-da-mat-c4.html" },
      { name: "Sữa Rửa Mặt", url: "/danh-muc/sua-rua-mat-c19.html" },
      { name: "Nari Botanicals", url: "/thuong-hieu/nari-botanicals" },
      { name: "Nari Lab", url: "/thuong-hieu/nari-lab" },
      { name: "Serum Phục Hồi", url: "/tim-kiem?q=serum" },
      { name: "Gel Rửa Mặt Dịu Nhẹ", url: "/tim-kiem?q=sua+rua+mat" },
      { name: "Nari Deals", url: "/deals-dang-dien-ra.html" },
      { name: "Sản Phẩm Bán Chạy", url: "/san-pham-ban-chay.html" },
      { name: "Hàng Mới Về", url: "/hang-moi-ve.html" },
      { name: "Hệ Thống Cửa Hàng", url: "/he-thong-cua-hang" },
    ],
    companyInfo: {
      name: "CÔNG TY CỔ PHẦN MỸ PHẨM NARI HOME",
      license: "Giấy chứng nhận ĐKKD số 0313612829 do Sở Kế hoạch và Đầu tư TP.HCM cấp ngày 13/01/2016",
      address: "Trụ sở chính: 71 Hoàng Hoa Thám, Phường Tân Bình, Thành phố Hồ Chí Minh",
      copyright: "Bản quyền © 2016 - 2026 Nari Home.",
    },
  };
}
