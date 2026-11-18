/**
 * Central Backend Contracts & Domain Types for Nari Home Clone.
 * Indexed by CodeGraph to map frontend views -> adapter services -> future backend API endpoints.
 */

export interface ProductSummary {
  id?: number | string;
  sku?: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  old: number;
  sale: number;
  image?: string;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  description?: string;
  isSample?: boolean;
}

export interface ProductSpecRow {
  label: string;
  value: string;
}

export interface ProductReviewItem {
  id: string | number;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
  variant?: string;
  answer?: string;
  answerCreatedAt?: string;
}

export interface ProductRatingSummary {
  average: number;
  totalCount: number;
  stars: Array<{
    star: number;
    count: number;
    description: string;
  }>;
  reviews: ProductReviewItem[];
}

export interface ProductCommentItem {
  id: string | number;
  author: string;
  content: string;
  createdAt: string;
  likeCount: number;
  replies?: Array<{
    id: string | number;
    author: string;
    content: string;
    createdAt: string;
    isAdmin?: boolean;
  }>;
}

export interface ProductDetailData extends ProductSummary {
  englishName?: string;
  images: string[];
  specs: ProductSpecRow[];
  overviewHtml?: string;
  ingredientsText?: string;
  usageText?: string;
  ratingSummary?: ProductRatingSummary;
  comments?: ProductCommentItem[];
  sourceUrl?: string;
}

export interface CategoryNode {
  id: number | string;
  name: string;
  slug: string;
  parentSlug?: string;
  children?: CategoryNode[];
}

export interface FacetOption {
  label: string;
  value: string | number;
  count?: number;
}

export interface FacetGroup {
  key: string;
  name: string;
  options: FacetOption[];
}

export interface BrandSummary {
  id?: number | string;
  name: string;
  slug: string;
  url: string;
  image?: string;
  logo?: string;
  cover?: string;
  letter?: string;
  description?: string;
  productCount?: number;
}

export interface CampaignBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  href: string;
  badge?: string;
}

export interface StoreBranchInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  phone?: string;
  hours?: string;
  hasClinic?: boolean;
  image?: string;
  mapUrl?: string;
}

export interface SupportTopic {
  slug: string;
  title: string;
  category: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string[];
  }>;
  sourceUrl: string;
}

export interface LocationSelection {
  province: string;
  district: string;
  ward: string;
  updatedAt?: string;
}

export interface CustomerOrderDraft {
  id: string;
  createdAt: string;
  status: "draft" | "pending_Verify" | "demo";
  recipientName: string;
  recipientPhone: string;
  address: string;
  paymentMethod: string;
  totalAmount: number;
  itemCount: number;
}
