import { serviceUnavailable } from "@/lib/server/access-policy";
import { NextResponse } from "next/server";
import { getRichProductDetail } from "@/lib/product-details";
import { getAllCatalogProducts } from "@/lib/catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { getProductFeedback } from "@/lib/server/db";
import type { ProductDetailData, ProductRatingSummary } from "@/lib/backend-contracts";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const decodedSlug = decodeURIComponent(slug);

    const live = await readStorefrontCatalog();
    if (live.deletedSlugs.includes(decodedSlug)) return NextResponse.json({ ok: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
    let detail = getRichProductDetail(decodedSlug, live);

    // Fallback to static catalog item only in non-postgres development snapshots
    if (!detail && live.source !== "postgres") {
      const fallback = getAllCatalogProducts(live).find((product) => product.slug === decodedSlug);
      if (fallback) {
        detail = {
          id: fallback.id,
          sku: fallback.sku,
          slug: fallback.slug,
          name: fallback.name,
          brand: fallback.brand,
          category: fallback.category,
          price: fallback.price,
          old: fallback.old,
          sale: fallback.sale,
          image: fallback.image,
          images: fallback.image ? [fallback.image] : [],
          rating: fallback.rating,
          reviewCount: fallback.reviewCount,
          sold: fallback.sold,
          description: fallback.description,
          isSample: fallback.isSample,
          specs: [
            { label: "Thương hiệu", value: fallback.brand },
            { label: "Danh mục", value: fallback.category },
          ],
        };
      }
    }

    if (!detail) {
      return NextResponse.json(
        { ok: false, error: `Product '${decodedSlug}' not found.` },
        { status: 404 }
      );
    }

    // Merge runtime reviews and comments
    const runtimeFb = live.source === "postgres" ? { reviews: [], comments: [] } : getProductFeedback(decodedSlug);
    const mergedDetail: ProductDetailData = { ...detail };

    if (runtimeFb.reviews.length > 0) {
      const existingReviews = detail.ratingSummary?.reviews || [];
      const allReviews = [...runtimeFb.reviews, ...existingReviews];
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      const ratingSummary: ProductRatingSummary = {
        average: Math.round(avg * 10) / 10,
        totalCount: allReviews.length,
        stars: detail.ratingSummary?.stars || [
          { star: 5, count: allReviews.filter(r => r.rating === 5).length, description: "Rất hài lòng" },
          { star: 4, count: allReviews.filter(r => r.rating === 4).length, description: "Hài lòng" },
          { star: 3, count: allReviews.filter(r => r.rating === 3).length, description: "Bình thường" },
          { star: 2, count: allReviews.filter(r => r.rating === 2).length, description: "Không hài lòng" },
          { star: 1, count: allReviews.filter(r => r.rating === 1).length, description: "Rất tệ" },
        ],
        reviews: allReviews,
      };
      mergedDetail.ratingSummary = ratingSummary;
      mergedDetail.rating = ratingSummary.average;
      mergedDetail.reviewCount = ratingSummary.totalCount;
    }

    if (runtimeFb.comments.length > 0) {
      const existingComments = detail.comments || [];
      mergedDetail.comments = [...runtimeFb.comments, ...existingComments];
    }

    return NextResponse.json({
      ok: true,
      data: mergedDetail,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST() {
  return serviceUnavailable();
}
