import type {
  ProductDetailData,
  ProductRatingSummary,
  ProductCommentItem,
  ProductSummary,
  BrandSummary,
} from "@/lib/backend-contracts";
import { products as catalogProducts } from "@/lib/catalog";
import rawBrandCatalog from "../../docs/research/hasaki/brand-catalog-2026-11-13.json";
import rawRichDetails from "../../docs/research/hasaki/product-rich-details-2026-11-13.json";
import { brandDeep } from "@/lib/brand-config";

const brandCatalogRaw = brandDeep(rawBrandCatalog);
const richDetailsRaw = brandDeep(rawRichDetails);

interface RawBrandItem {
  id?: number | string | null;
  name: string;
  slug: string;
  url: string;
  brandKey?: string;
  logo?: string;
  image?: string;
  cover?: string;
  letter?: string;
  productCount?: number;
  description?: string;
  topProducts?: RawProductItem[];
}

interface RawProductItem {
  id: number | string;
  sku?: string;
  name: string;
  slug: string;
  brand: string;
  price: number;
  old: number;
  sale: number;
  image?: string;
  category: string;
  categoryName?: string;
  rating?: number;
  reviewCount?: number;
  boughtCount?: number;
}

interface RawRichProduct {
  id: string | number;
  slug: string;
  sku?: string;
  name: string;
  englishName?: string;
  brand: string;
  brandLogo?: string;
  brandUrl?: string;
  price: number;
  old: number;
  sale: number;
  category: string;
  categoryName?: string;
  images: string[];
  specs: Array<{ label: string; value: string }>;
  descriptionShort?: string;
  overviewHtml?: string;
  ingredientsHtml?: string;
  usageHtml?: string;
  ratingSummary?: {
    average: number;
    totalCount: number;
    stars: Array<{ star: number; count: number; description: string }>;
    reviews: Array<{
      id: string | number;
      author: string;
      rating: number;
      comment: string;
      createdAt: string;
      answer?: string;
      answerCreatedAt?: string;
    }>;
  };
  comments?: Array<{
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
  }>;
  commentsCount?: number;
  sourceUrl?: string;
}

const richDetailsMap = richDetailsRaw as unknown as Record<string, RawRichProduct>;
const featuredBrandsMap = (brandCatalogRaw as { featuredBrands?: Record<string, RawBrandItem> }).featuredBrands || {};
const brandsLookupList = (brandCatalogRaw as { brandsLookup?: RawBrandItem[] }).brandsLookup || [];

/**
 * Normalizes slug or id key into rich product details.
 */
export function getRichProductDetail(slugOrId: string): ProductDetailData | null {
  if (!slugOrId) return null;
  const direct = richDetailsMap[slugOrId];
  if (direct) {
    return transformRichProduct(direct);
  }

  // Extract numeric id if slug ends with -<id>.html
  const match = slugOrId.match(/(\d+)\.html$/);
  if (match) {
    const idKey = match[1];
    const byId = richDetailsMap[idKey];
    if (byId) {
      return transformRichProduct(byId);
    }
  }

  // Fallback to static catalog item if available
  const catalogItem = catalogProducts.find(
    p => p.slug === slugOrId || p.slug.endsWith(`-${slugOrId}.html`)
  );
  if (catalogItem) {
    return {
      slug: catalogItem.slug,
      name: catalogItem.name,
      brand: catalogItem.brand,
      category: catalogItem.category,
      price: catalogItem.price,
      old: catalogItem.old,
      sale: catalogItem.sale,
      images: [],
      specs: [
        { label: "Thương Hiệu", value: catalogItem.brand },
        { label: "Danh Mục", value: catalogItem.category },
      ],
      isSample: true,
      sourceUrl: `https://Nari Home/san-pham/${catalogItem.slug}`,
    };
  }

  return null;
}

function transformRichProduct(raw: RawRichProduct): ProductDetailData {
  return {
    id: raw.id,
    sku: raw.sku,
    slug: raw.slug,
    name: raw.name,
    brand: raw.brand,
    category: raw.category,
    price: raw.price,
    old: raw.old,
    sale: raw.sale,
    image: raw.images[0] || undefined,
    images: raw.images,
    specs: raw.specs,
    description: raw.descriptionShort,
    overviewHtml: raw.overviewHtml,
    ingredientsText: raw.ingredientsHtml,
    usageText: raw.usageHtml,
    rating: raw.ratingSummary?.average,
    reviewCount: raw.ratingSummary?.totalCount,
    ratingSummary: raw.ratingSummary
      ? {
          average: raw.ratingSummary.average,
          totalCount: raw.ratingSummary.totalCount,
          stars: raw.ratingSummary.stars,
          reviews: raw.ratingSummary.reviews.map(r => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            answer: r.answer,
            answerCreatedAt: r.answerCreatedAt,
          })),
        }
      : undefined,
    comments: raw.comments?.map(c => ({
      id: c.id,
      author: c.author,
      content: c.content,
      createdAt: c.createdAt,
      likeCount: c.likeCount,
      replies: c.replies,
    })),
    sourceUrl: raw.sourceUrl,
    isSample: false,
  };
}

/**
 * Returns rating summary for product, including star breakdown and reviews.
 */
export function getProductReviews(slugOrId: string): ProductRatingSummary | null {
  const detail = getRichProductDetail(slugOrId);
  return detail?.ratingSummary ?? null;
}

/**
 * Returns customer comments and Q&A replies for product.
 */
export function getProductComments(slugOrId: string): ProductCommentItem[] {
  const detail = getRichProductDetail(slugOrId);
  return detail?.comments ?? [];
}

/**
 * Returns a dictionary of brand logos, covers, and product counts for fast lookup.
 */
export function getBrandEnhancements(): Record<
  string,
  { logo: string; productCount: number; cover?: string; name: string }
> {
  const result: Record<
    string,
    { logo: string; productCount: number; cover?: string; name: string }
  > = {};

  for (const item of brandsLookupList) {
    if (item.image) {
      if (item.slug) {
        result[item.slug.toLowerCase()] = {
          logo: item.image,
          productCount: item.productCount || 0,
          cover: item.cover,
          name: item.name,
        };
      }
      result[item.name.toLowerCase()] = {
        logo: item.image,
        productCount: item.productCount || 0,
        cover: item.cover,
        name: item.name,
      };
    }
  }

  for (const [key, item] of Object.entries(featuredBrandsMap)) {
    const entry = {
      logo: item.logo || item.image || "",
      productCount: item.productCount || 0,
      cover: item.cover,
      name: item.name,
    };
    result[key.toLowerCase()] = entry;
    if (item.slug) result[item.slug.toLowerCase()] = entry;
    result[item.name.toLowerCase()] = entry;
  }

  return result;
}

/**
 * Returns brand metadata including logo, cover, description, and product count.
 */
export function getBrandMetadata(slug: string): BrandSummary | null {
  if (!slug) return null;
  const cleanSlug = slug.endsWith(".html") ? slug : `${slug}.html`;
  const baseKey = slug.replace(".html", "").toLowerCase();

  // 1. Check featured brands
  for (const [key, item] of Object.entries(featuredBrandsMap)) {
    if (
      key.toLowerCase() === baseKey ||
      item.slug.toLowerCase() === cleanSlug.toLowerCase() ||
      item.name.toLowerCase() === baseKey
    ) {
      return {
        id: item.id ?? undefined,
        name: item.name,
        slug: item.slug,
        url: item.url || `/thuong-hieu/${item.slug}`,
        logo: item.logo || item.image,
        image: item.logo || item.image,
        cover: item.cover,
        description: item.description,
        productCount: item.productCount,
      };
    }
  }

  // 2. Check general brands lookup
  const matched = brandsLookupList.find(
    b =>
      b.slug.toLowerCase() === cleanSlug.toLowerCase() ||
      b.name.toLowerCase() === baseKey
  );
  if (matched) {
    return {
      id: matched.id ?? undefined,
      name: matched.name,
      slug: matched.slug,
      url: matched.url || `/thuong-hieu/${matched.slug}`,
      logo: matched.image,
      image: matched.image,
      cover: matched.cover,
      letter: matched.letter,
      productCount: undefined,
    };
  }

  return null;
}

/**
 * Returns real scraped products snapshot for a given brand name or slug.
 */
export function getBrandProductsSnapshot(brandNameOrSlug: string): ProductSummary[] {
  if (!brandNameOrSlug) return [];
  const cleanKey = brandNameOrSlug.replace(".html", "").toLowerCase();

  for (const [key, item] of Object.entries(featuredBrandsMap)) {
    if (
      key.toLowerCase() === cleanKey ||
      item.slug.toLowerCase() === `${cleanKey}.html` ||
      item.name.toLowerCase() === cleanKey
    ) {
      if (item.topProducts && item.topProducts.length > 0) {
        return item.topProducts.map(p => ({
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          name: p.name,
          brand: item.name,
          category: p.category,
          price: p.price,
          old: p.old,
          sale: p.sale,
          image: p.image,
          rating: p.rating,
          reviewCount: p.reviewCount,
          sold: p.boughtCount,
          isSample: false,
        }));
      }
    }
  }

  return [];
}
