export interface ClinicServiceDetailSummary {
  url: string;
  title: string;
  subtitle: string;
  image: string;
}

export interface ClinicServiceItem {
  id?: string;
  name: string;
  url: string;
  slug: string;
  image: string;
  price: string;
  duration: string;
  booking: string;
  description: string;
  detail?: ClinicServiceDetailSummary;
}

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

export const clinicServices: ClinicServiceItem[] = [];

export function getClinicServices(): ClinicServiceItem[] {
  return [];
}

export function getClinicServiceRichDetail(slug: string): ClinicServiceRichDetail | null {
  void slug;
  return null;
}
