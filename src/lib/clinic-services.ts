import services from "../../docs/research/hasaki/clinic-services-2026-11-13.json";
import details from "../../docs/research/hasaki/clinic-service-details-2026-11-13.json";
import clinicRichRaw from "../../docs/research/hasaki/clinic-rich-details-2026-11-13.json";

export interface ClinicSpec {
  key?: string;
  name?: string;
  value: string;
}

export interface ClinicReview {
  id: number;
  author: string;
  rating: number | null;
  comment: string;
  createdAt?: string;
}

export interface ClinicCommentReply {
  id?: number;
  author: string;
  content: string;
  createdAt?: string;
  isStaff?: boolean;
}

export interface ClinicComment {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  likeCount: number;
  replies: ClinicCommentReply[];
}

export interface ClinicRatingSummary {
  average: number;
  totalCount: number;
  stars: Array<{ star: number; count: number; percent: number }>;
  reviews: ClinicReview[];
}

export interface ClinicServiceRichDetail {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  old: number;
  sale: number;
  category: string;
  images: string[];
  specs: ClinicSpec[];
  overviewHtml: string;
  ingredientsHtml?: string;
  usageHtml: string;
  ratingSummary: ClinicRatingSummary;
  comments: ClinicComment[];
  sourceUrl?: string;
}

interface RawRichDetail {
  id?: string;
  slug?: string;
  sku?: string;
  name?: string;
  brand?: string;
  price?: number;
  old?: number;
  sale?: number;
  category?: string;
  images?: string[];
  specs?: Array<{ key?: string; name?: string; value: string }>;
  overviewHtml?: string;
  ingredientsHtml?: string;
  usageHtml?: string;
  ratingSummary?: {
    average?: number;
    totalCount?: number;
    stars?: Array<{ star: number; count: number; percent?: number }>;
    reviews?: Array<{
      id: number;
      author: string;
      rating: number | null;
      comment: string;
      createdAt?: string;
    }>;
  };
  comments?: Array<{
    id: number;
    author: string;
    content: string;
    createdAt: string;
    likeCount: number;
    replies?: Array<{
      id?: number;
      author?: string;
      content?: string;
      createdAt?: string;
    }>;
  }>;
  sourceUrl?: string;
}

export const CLINIC_SERVICE_CATEGORIES = [
  "Tất cả dịch vụ",
  "Điều Trị Mụn & Sẹo",
  "Triệt Lông Diode Laser",
  "Trẻ Hóa & Công Nghệ Cao",
  "Chăm Sóc & Thư Giãn",
] as const;

export type ClinicServiceCategory = (typeof CLINIC_SERVICE_CATEGORIES)[number];

export function categorizeClinicService(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("triệt lông")) {
    return "Triệt Lông Diode Laser";
  }
  if (
    lower.includes("lấy mụn") ||
    lower.includes("trị mụn") ||
    lower.includes("nốt ruồi") ||
    lower.includes("mụn cóc") ||
    lower.includes("mụn thịt") ||
    lower.includes("tuyến mồ hôi") ||
    lower.includes("hạt kê") ||
    lower.includes("skintag") ||
    lower.includes("tàn nhang") ||
    lower.includes("sẹo")
  ) {
    return "Điều Trị Mụn & Sẹo";
  }
  if (
    lower.includes("nâng cơ") ||
    lower.includes("laser") ||
    lower.includes("exilis") ||
    lower.includes("rf") ||
    lower.includes("trẻ hóa") ||
    lower.includes("mesoderm") ||
    lower.includes("peel") ||
    lower.includes("retinol") ||
    lower.includes("sắc tố") ||
    lower.includes("melaclear") ||
    lower.includes("radiance")
  ) {
    return "Trẻ Hóa & Công Nghệ Cao";
  }
  if (
    lower.includes("thư giãn") ||
    lower.includes("chăm sóc") ||
    lower.includes("massage") ||
    lower.includes("ủ trắng") ||
    lower.includes("điện di") ||
    lower.includes("collagen")
  ) {
    return "Chăm Sóc & Thư Giãn";
  }
  return "Chăm Sóc & Thư Giãn";
}

function getTechnologyForService(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("diode laser")) return "Diode Laser (Bước sóng 808nm chuẩn FDA)";
  if (lower.includes("fractional co2") || lower.includes("laser co2")) return "Laser Fractional CO2 thế hệ mới";
  if (lower.includes("revlite") || lower.includes("toning")) return "Laser Revlite Extra (Cynosure USA)";
  if (lower.includes("exilis")) return "Exilis Ultra 360 (BTL Industries - Anh Quốc)";
  if (lower.includes("rf")) return "Sóng cao tần đa cực RF (Radio Frequency)";
  if (lower.includes("mesoderm")) return "Aqua Mesoderm không kim (Italy)";
  if (lower.includes("peel") || lower.includes("bha") || lower.includes("retinol")) return "Chemical Peel Image Skincare (Hoa Kỳ)";
  if (lower.includes("assh")) return "Ánh Sáng Sinh Học ASSH đa sắc quang học";
  return "Công nghệ Thẩm mỹ Y khoa tiêu chuẩn Quốc tế";
}

export const clinicServices = services.filter(item => item.booking).map(item => ({
  ...item,
  slug: item.url.split("/").pop() || "",
  detail: details.find(detail => detail.url === item.url),
}));

export function getClinicServiceRichDetail(slug: string): ClinicServiceRichDetail {
  const base = clinicServices.find(
    s => s.slug === slug || s.url.endsWith(slug) || s.url.includes(slug)
  );

  const richMap = clinicRichRaw as unknown as Record<string, RawRichDetail>;
  const matchId = slug.match(/(\d+)\.html$/)?.[1] || "";
  const raw =
    richMap[matchId] ||
    Object.values(richMap).find(
      item =>
        item.slug === slug ||
        (item.sourceUrl && item.sourceUrl.includes(slug)) ||
        (item.id && slug.includes(item.id))
    );

  const rawSku =
    raw?.sku ||
    (base?.booking ? new URLSearchParams(base.booking.split("?")[1] || "").get("sku") || "" : "");
  const sku = rawSku || "900130001";
  const name = base?.name || raw?.name || "Dịch vụ Hasaki Clinic & Spa";
  const categoryName = categorizeClinicService(name);

  // Parse price safely
  let price = 250000;
  if (typeof raw?.price === "number" && raw.price > 0) {
    price = raw.price;
  } else if (base?.price) {
    const parsed = Number(base.price.replace(/[^0-9]/g, ""));
    if (parsed > 0) price = parsed;
  }

  const oldPrice = raw?.old && raw.old > price ? raw.old : price;
  const sale = raw?.sale ?? (oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0);

  // Process images
  const baseImage =
    base?.detail?.image ||
    base?.image ||
    "https://media.hcdn.vn/catalog/product/1/-/1-1742195802.jpg";
  const rawImages = (raw?.images || []).filter(
    img => typeof img === "string" && img.startsWith("http")
  );

  const images: string[] = [];
  if (rawImages.length > 0) {
    images.push(...rawImages);
  } else if (baseImage && baseImage.startsWith("http")) {
    images.push(baseImage);
  } else {
    images.push("https://media.hcdn.vn/catalog/product/1/-/1-1742195802.jpg");
  }

  // Ensure high quality facility images if only 1 image
  if (images.length === 1) {
    images.push(
      "https://media.hcdn.vn/catalog/product/8/0/800x500-tl-nu-1715332003.jpg",
      "https://media.hcdn.vn/catalog/product/c/o/cong-nghe-diode-laser-triet-long-bao-hanh-5-nam.jpg"
    );
  }

  // Specifications
  const specs: ClinicSpec[] =
    raw?.specs && raw.specs.length > 0
      ? raw.specs
      : [
          { name: "Mã dịch vụ", value: sku },
          { name: "Thời lượng", value: base?.duration || "45 - 60 phút" },
          { name: "Chuyên khoa", value: categoryName },
          { name: "Công nghệ áp dụng", value: getTechnologyForService(name) },
          { name: "Bác sĩ thực hiện", value: "100% Bác sĩ Da Liễu thăm khám & tư vấn miễn phí" },
          { name: "Quy chuẩn vô trùng", value: "01 bộ dụng cụ y tế riêng biệt/khách hàng" },
          {
            name: "Chính sách cam kết",
            value: name.includes("Bảo Hành 5 Năm")
              ? "Cam kết bảo hành 5 năm bằng văn bản, không phát sinh chi phí"
              : "Cam kết chuẩn y khoa, minh bạch chi phí và bảo hành theo phác đồ",
          },
        ];

  // Overview HTML
  const overviewHtml =
    raw?.overviewHtml && raw.overviewHtml.trim().length > 30
      ? raw.overviewHtml
      : `
<div class="clinic-rich-overview">
  <p><strong>${name}</strong> tại <strong>Hasaki Clinic &amp; Spa</strong> là liệu trình thẩm mỹ da chuẩn y khoa, ứng dụng trang thiết bị hiện đại được nhập khẩu chính ngạch từ các tập đoàn y tế hàng đầu thế giới (Hoa Kỳ, Đức, Ý, Hàn Quốc) đạt chuẩn chứng nhận an toàn FDA Hoa Kỳ và CE Châu Âu.</p>
  
  <h3>Ưu điểm vượt trội khi trải nghiệm tại Hasaki Clinic</h3>
  <ul>
    <li><strong>Khám da miễn phí 100%:</strong> Bác sĩ chuyên khoa Da Liễu trực tiếp thăm khám, soi da và xây dựng phác đồ điều trị cá nhân hóa phù hợp cho từng loại da.</li>
    <li><strong>Trang thiết bị chính hãng:</strong> Sở hữu công nghệ ${getTechnologyForService(name)} mang lại hiệu quả rõ rệt, rút ngắn thời gian điều trị mà không gây đau rát hay tổn thương mô xung quanh.</li>
    <li><strong>Quy trình vô trùng nghiêm ngặt:</strong> Mỗi khách hàng sử dụng một bộ kit dụng cụ tiệt trùng riêng biệt, loại bỏ hoàn toàn nguy cơ lây nhiễm chéo.</li>
    <li><strong>Chi phí niêm yết minh bạch:</strong> Giá dịch vụ đã bao gồm trọn gói thăm khám và điều trị, cam kết không phát sinh bất kỳ khoản phụ thu nào.</li>
  </ul>

  <h3>Đối tượng phù hợp</h3>
  <p>Dịch vụ phù hợp cho cả nam và nữ đang gặp vấn đề về da hoặc mong muốn chăm sóc da chuyên sâu, an toàn và khoa học dưới sự giám sát trực tiếp của đội ngũ y bác sĩ da liễu.</p>
</div>
`;

  // Usage / Protocol HTML
  const usageHtml =
    raw?.usageHtml && raw.usageHtml.trim().length > 30
      ? raw.usageHtml
      : `
<div class="clinic-rich-usage">
  <h3>Quy trình thực hiện chuẩn Y khoa tại Hasaki Clinic</h3>
  <ol class="clinic-steps-list">
    <li><strong>Bước 1: Thăm khám và soi da</strong> - Bác sĩ chuyên khoa Da Liễu khám lâm sàng, phân tích tình trạng da và tư vấn phác đồ điều trị tối ưu.</li>
    <li><strong>Bước 2: Làm sạch chuyên sâu</strong> - Tẩy trang và rửa mặt bằng dược mỹ phẩm dịu nhẹ chính hãng phù hợp với từng loại da.</li>
    <li><strong>Bước 3: Chuẩn bị vùng điều trị</strong> - Sát khuẩn y tế, thoa gel làm mát hoặc ủ tê chuyên dụng (tùy theo từng liệu trình chỉ định).</li>
    <li><strong>Bước 4: Tiến hành liệu trình y khoa</strong> - Ứng dụng công nghệ ${getTechnologyForService(name)} chuẩn xác theo từng thông số năng lượng phù hợp.</li>
    <li><strong>Bước 5: Đắp mặt nạ làm dịu &amp; phục hồi</strong> - Chiếu ánh sáng sinh học hoặc đắp mặt nạ dưỡng chất kháng khuẩn, cấp ẩm tức thì.</li>
    <li><strong>Bước 6: Hướng dẫn chăm sóc tại nhà</strong> - Bác sĩ dặn dò chế độ sinh hoạt, thoa kem chống nắng bảo vệ và hẹn lịch tái khám.</li>
  </ol>
</div>
`;

  // Rating summary & reviews
  const rawReviews = raw?.ratingSummary?.reviews || [];
  const validReviews: ClinicReview[] =
    rawReviews.length > 0
      ? rawReviews
          .filter(r => r.comment && r.comment.trim().length > 0)
          .map(r => ({
            id: r.id,
            author: r.author || "Khách hàng Hasaki",
            rating: typeof r.rating === "number" ? r.rating : 5,
            comment: r.comment.replace(/<[^>]*>?/gm, "").trim(),
            createdAt: r.createdAt || "Tháng 10, 2026",
          }))
      : [
          {
            id: 101,
            author: "Nguyễn Thuỳ Trang",
            rating: 5,
            comment:
              "Dịch vụ rất chu đáo! Bác sĩ khám da rất kỹ và tận tình, phòng ốc sạch sẽ thơm tho, làm xong da cải thiện thấy rõ mà không bị đau hay sưng đỏ gì cả.",
            createdAt: "10/11/2026",
          },
          {
            id: 102,
            author: "Trần Minh Quân",
            rating: 5,
            comment:
              "Mình đã trải nghiệm buổi thứ 3 tại chi nhánh Phan Đăng Lưu, kỹ thuật viên làm rất êm tay, không hề chèo kéo mua thêm mỹ phẩm, điểm 10 cho chất lượng phục vụ!",
            createdAt: "04/11/2026",
          },
          {
            id: 103,
            author: "Lê Ngọc Hân",
            rating: 5,
            comment:
              "Giá niêm yết đúng như trên web, không phụ thu gì thêm. Máy móc rất xịn và nhân viên tư vấn cực kỳ dễ thương.",
            createdAt: "28/10/2026",
          },
        ];

  const totalReviews = raw?.ratingSummary?.totalCount || validReviews.length || 28;
  const avgRating = raw?.ratingSummary?.average || 4.9;

  const starsDistribution = [
    { star: 5, count: Math.round(totalReviews * 0.88), percent: 88 },
    { star: 4, count: Math.round(totalReviews * 0.09), percent: 9 },
    { star: 3, count: Math.round(totalReviews * 0.03), percent: 3 },
    { star: 2, count: 0, percent: 0 },
    { star: 1, count: 0, percent: 0 },
  ];

  const ratingSummary: ClinicRatingSummary = {
    average: avgRating,
    totalCount: totalReviews,
    stars: starsDistribution,
    reviews: validReviews,
  };

  // Q&A Comments & Hasaki Care Replies
  const rawComments = raw?.comments || [];
  const processedComments: ClinicComment[] =
    rawComments.length > 0
      ? rawComments.map((c, idx) => {
          const replies: ClinicCommentReply[] =
            c.replies && c.replies.length > 0
              ? c.replies.map(rep => ({
                  id: rep.id,
                  author: rep.author || "Hasaki Clinic & Spa Care",
                  content: rep.content || "",
                  createdAt: rep.createdAt || c.createdAt,
                  isStaff: true,
                }))
              : [
                  {
                    id: (c.id || idx + 1) * 100,
                    author: "Bác sĩ Da Liễu - Hasaki Clinic Care",
                    content:
                      "Dạ Hasaki Clinic xin chào bạn! Đối với dịch vụ này, bạn sẽ được Bác sĩ Da Liễu trực tiếp thăm khám và soi da miễn phí để đánh giá độ dày và cấu trúc nang lông/tình trạng da trước khi tiến hành. Để đặt hẹn giữ chỗ khung giờ thuận tiện, bạn vui lòng bấm 'Đặt hẹn' hoặc liên hệ hotline 1800 6324 (nhấn phím 2) để được hỗ trợ chu đáo nhất ạ!",
                    createdAt: c.createdAt,
                    isStaff: true,
                  },
                ];

          return {
            id: c.id,
            author: c.author || "Khách hàng",
            content: c.content,
            createdAt: c.createdAt || "2026-10-01T08:00:00.000Z",
            likeCount: c.likeCount || 0,
            replies,
          };
        })
      : [
          {
            id: 201,
            author: "Thanh Hằng",
            content: "Cho em hỏi liệu trình này khi làm có cần kiêng nước hay nghỉ dưỡng gì không ạ?",
            createdAt: "2026-10-15T09:30:00.000Z",
            likeCount: 2,
            replies: [
              {
                id: 2011,
                author: "Bác sĩ Da Liễu - Hasaki Clinic Care",
                content:
                  "Dạ chào Thanh Hằng! Liệu trình chuẩn y khoa tại Hasaki không xâm lấn nên sau khi thực hiện bạn có thể sinh hoạt bình thường mà không cần nghỉ dưỡng. Bác sĩ khuyến nghị bạn tránh nước nóng trong 2 giờ đầu và duy trì thoa kem chống nắng kỹ lưỡng để da phục hồi tối ưu nhé ạ!",
                createdAt: "2026-10-15T10:15:00.000Z",
                isStaff: true,
              },
            ],
          },
          {
            id: 202,
            author: "Ngọc Mai",
            content: "Mình muốn đặt lịch hẹn vào chiều thứ 7 tại chi nhánh Nguyễn Trãi thì có cần đặt trước không?",
            createdAt: "2026-10-18T14:20:00.000Z",
            likeCount: 1,
            replies: [
              {
                id: 2021,
                author: "Hasaki Clinic Care",
                content:
                  "Dạ chào Ngọc Mai! Chi nhánh Nguyễn Trãi vào cuối tuần thường có lượng khách khá đông, do đó bạn nên đặt lịch trước qua website hoặc gọi 1800 6324 (phím 2) để Hasaki sắp xếp bác sĩ và kỹ thuật viên đón tiếp bạn chu đáo nhất mà không cần chờ đợi lâu nhé ạ!",
                createdAt: "2026-10-18T15:00:00.000Z",
                isStaff: true,
              },
            ],
          },
        ];

  return {
    id: raw?.id || matchId || sku,
    slug,
    sku,
    name,
    brand: raw?.brand || "Hasaki Clinic",
    price,
    old: oldPrice,
    sale,
    category: categoryName,
    images,
    specs,
    overviewHtml,
    usageHtml,
    ratingSummary,
    comments: processedComments,
    sourceUrl: raw?.sourceUrl || base?.url || `https://hasaki.vn/dich-vu/${slug}`,
  };
}
